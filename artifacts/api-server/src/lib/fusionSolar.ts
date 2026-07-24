/**
 * Huawei FusionSolar Northbound API client
 *
 * Handles login/session renewal, rate-limit-friendly in-memory caching,
 * and mapping raw FusionSolar response fields to clean DTOs.
 *
 * Environment variables required:
 *   FUSIONSOLAR_USERNAME    – portal username
 *   FUSIONSOLAR_SYSTEM_CODE – system code (API password)
 *   FUSIONSOLAR_BASE_URL    – e.g. https://sg5.fusionsolar.huawei.com (defaults to sg5)
 */

const BASE_URL =
  (process.env.FUSIONSOLAR_BASE_URL || "https://sg5.fusionsolar.huawei.com").replace(/\/$/, "");

// ─── Session management ───────────────────────────────────────────────────────

interface Session {
  token: string;
  expiresAt: number; // ms epoch
}

let _session: Session | null = null;
let _loginInFlight: Promise<string> | null = null;

async function doLogin(): Promise<string> {
  const username = process.env.FUSIONSOLAR_USERNAME;
  const systemCode = process.env.FUSIONSOLAR_SYSTEM_CODE;
  if (!username || !systemCode) {
    throw new Error("FUSIONSOLAR_USERNAME and FUSIONSOLAR_SYSTEM_CODE must be set");
  }

  const res = await fetch(`${BASE_URL}/thirdData/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: username, systemCode }),
  });

  if (!res.ok) {
    throw new Error(`FusionSolar login HTTP error: ${res.status} ${res.statusText}`);
  }

  const body = await res.json() as { success: boolean; failCode?: number; message?: string };
  if (!body.success) {
    throw new Error(`FusionSolar login failed: code=${body.failCode} ${body.message ?? ""}`);
  }

  // The XSRF-TOKEN is in the Set-Cookie header
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/XSRF-TOKEN=([^;,\s]+)/);
  if (!match?.[1]) {
    throw new Error("FusionSolar login did not return XSRF-TOKEN cookie");
  }

  return match[1];
}

async function getToken(): Promise<string> {
  const now = Date.now();
  if (_session && _session.expiresAt > now + 90_000) {
    return _session.token;
  }
  // Deduplicate concurrent login requests
  if (!_loginInFlight) {
    _loginInFlight = doLogin().finally(() => { _loginInFlight = null; });
  }
  const token = await _loginInFlight;
  _session = { token, expiresAt: now + 28 * 60_000 }; // 28-min TTL (portal expires at 30)
  return token;
}

// ─── Core API call ────────────────────────────────────────────────────────────

async function callApi(path: string, body: Record<string, unknown>): Promise<unknown> {
  let token = await getToken();

  const makeRequest = (tok: string) =>
    fetch(`${BASE_URL}/thirdData/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `XSRF-TOKEN=${tok}`,
        "roarand": tok, // FusionSolar requires token in both cookie AND this header
      },
      body: JSON.stringify(body),
    });

  let res = await makeRequest(token);

  // Session expired mid-request — re-login once
  if (res.status === 305 || res.status === 401) {
    _session = null;
    token = await getToken();
    res = await makeRequest(token);
  }

  if (!res.ok) {
    throw new Error(`FusionSolar API HTTP ${res.status} on /${path}`);
  }

  const json = await res.json() as { success: boolean; data?: unknown; failCode?: number; message?: string };
  if (!json.success) {
    // failCode 305 = session expired
    if (json.failCode === 305) {
      _session = null;
      token = await getToken();
      const retry = await makeRequest(token);
      const retryJson = await retry.json() as typeof json;
      if (!retryJson.success) {
        throw new Error(`FusionSolar /${path} error after re-login: ${retryJson.failCode} ${retryJson.message ?? ""}`);
      }
      return retryJson.data;
    }
    throw new Error(`FusionSolar /${path} error: code=${json.failCode} ${json.message ?? ""}`);
  }

  return json.data;
}

// ─── Device list cache (24 h) ─────────────────────────────────────────────────

interface DevEntry {
  devId: string;
  expiresAt: number;
}
const _devCache = new Map<string, DevEntry>();

async function getInverterDevId(stationCode: string): Promise<string> {
  const now = Date.now();
  const cached = _devCache.get(stationCode);
  if (cached && cached.expiresAt > now) return cached.devId;

  const data = await callApi("getDevList", { stationCodes: stationCode }) as unknown[];
  const list = Array.isArray(data) ? data : [];
  // devTypeId 1 = string inverter (most common for residential/SME)
  const inverter = list.find((d: any) => d.devTypeId === 1) as any;
  if (!inverter) {
    throw new Error(`No string inverter (devTypeId=1) found for station ${stationCode}`);
  }
  const devId = String(inverter.id);
  _devCache.set(stationCode, { devId, expiresAt: now + 24 * 3_600_000 });
  return devId;
}

// ─── Inverter state → readable status ────────────────────────────────────────

const INVERTER_STATE_MAP: Record<number, string> = {
  512: "generating",
  513: "generating",
  514: "generating",
  515: "fault",
  516: "offline",
  517: "standby",
  518: "standby",
  519: "offline",
  520: "offline",
};

function mapStatus(state: number | null | undefined, activePower: number): string {
  if (state != null && INVERTER_STATE_MAP[state]) return INVERTER_STATE_MAP[state];
  if (activePower > 0) return "generating";
  return "unknown";
}

// ─── In-memory caches ─────────────────────────────────────────────────────────

interface CacheEntry { data: unknown; expiresAt: number }
const _realtimeCache = new Map<string, CacheEntry>();
const _dailyCache    = new Map<string, CacheEntry>();
const _monthlyCache  = new Map<string, CacheEntry>();
const _annualCache   = new Map<string, CacheEntry>();

function fromCache<T>(map: Map<string, CacheEntry>, key: string): T | null {
  const e = map.get(key);
  if (e && e.expiresAt > Date.now()) return e.data as T;
  return null;
}
function toCache(map: Map<string, CacheEntry>, key: string, data: unknown, ttlMs: number) {
  map.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RealtimeKpi {
  stationCode: string;
  powerKw: number;
  todayYieldKwh: number;
  totalYieldMwh: number;
  performanceRatio: number;
  status: string;
  inverterState: number | null;
  temperatureC: number | null;
  updatedAt: string;
}

export async function getRealtime(stationCode: string): Promise<RealtimeKpi> {
  const cached = fromCache<RealtimeKpi>(_realtimeCache, stationCode);
  if (cached) return cached;

  const devId = await getInverterDevId(stationCode);
  const data = await callApi("getDevRealKpi", { devIds: devId, devTypeId: 1 }) as unknown[];
  const list = Array.isArray(data) ? data : [];
  const kpi: Record<string, unknown> = (list[0] as any)?.dataItemMap ?? {};

  const activePower = Number(kpi.active_power ?? 0);
  const state = kpi.inverter_state != null ? Number(kpi.inverter_state) : null;

  const result: RealtimeKpi = {
    stationCode,
    powerKw: activePower,
    todayYieldKwh: Number(kpi.day_cap ?? 0),
    totalYieldMwh: Number(kpi.total_cap ?? 0) / 1000,
    performanceRatio: Number(kpi.efficiency ?? 0),
    status: mapStatus(state, activePower),
    inverterState: state,
    temperatureC: kpi.temperature != null ? Number(kpi.temperature) : null,
    updatedAt: new Date().toISOString(),
  };

  toCache(_realtimeCache, stationCode, result, 60_000); // 1-min TTL
  return result;
}

export interface DailyPoint {
  collectTime: number;
  timeLabel: string;
  powerKw: number;
  yieldKwh: number;
  irradiationKwhm2: number;
}

export interface DailyData {
  date: string;
  points: DailyPoint[];
  totalYieldKwh: number;
  peakPowerKw: number;
}

export async function getDaily(stationCode: string, date: string): Promise<DailyData> {
  const key = `${stationCode}:${date}`;
  const cached = fromCache<DailyData>(_dailyCache, key);
  if (cached) return cached;

  // Malaysia is UTC+8 — request the start of day in local time
  const collectTime = new Date(`${date}T00:00:00+08:00`).getTime();
  const data = await callApi("getKpiStationDay", { stationCodes: stationCode, collectTime }) as unknown[];
  const list = Array.isArray(data) ? data : [];

  const points: DailyPoint[] = list.map((item: any) => {
    // FusionSolar collectTime is UTC ms; display in UTC+8
    const dt = new Date(item.collectTime);
    const h = String(dt.getUTCHours() + 8).padStart(2, "0");
    const m = String(dt.getUTCMinutes()).padStart(2, "0");
    const kpi: Record<string, unknown> = item.dataItemMap ?? {};
    return {
      collectTime: item.collectTime,
      timeLabel: `${h}:${m}`,
      powerKw: Number(kpi.inverter_power ?? 0),
      yieldKwh: Number(kpi.power_profit ?? 0),
      irradiationKwhm2: Number(kpi.radiation_intensity ?? 0),
    };
  });

  const totalYieldKwh = points.reduce((s, p) => s + p.yieldKwh, 0);
  const peakPowerKw = points.reduce((max, p) => Math.max(max, p.powerKw), 0);

  const result: DailyData = { date, points, totalYieldKwh, peakPowerKw };
  const isToday = date === new Date().toISOString().slice(0, 10);
  toCache(_dailyCache, key, result, isToday ? 5 * 60_000 : 24 * 3_600_000);
  return result;
}

export interface MonthlyDay {
  date: string;
  yieldKwh: number;
  irradiationKwhm2: number;
}

export interface MonthlyData {
  year: number;
  month: number;
  days: MonthlyDay[];
  totalYieldKwh: number;
}

export async function getMonthly(stationCode: string, year: number, month: number): Promise<MonthlyData> {
  const key = `${stationCode}:${year}:${month}`;
  const cached = fromCache<MonthlyData>(_monthlyCache, key);
  if (cached) return cached;

  const mm = String(month).padStart(2, "0");
  const collectTime = new Date(`${year}-${mm}-01T00:00:00+08:00`).getTime();
  const data = await callApi("getKpiStationMonth", { stationCodes: stationCode, collectTime }) as unknown[];
  const list = Array.isArray(data) ? data : [];

  const days: MonthlyDay[] = list.map((item: any) => {
    const dt = new Date(item.collectTime);
    const y = dt.getUTCFullYear();
    const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    const kpi: Record<string, unknown> = item.dataItemMap ?? {};
    return {
      date: `${y}-${mo}-${d}`,
      yieldKwh: Number(kpi.power_profit ?? 0),
      irradiationKwhm2: Number(kpi.radiation_intensity ?? 0),
    };
  });

  const totalYieldKwh = days.reduce((s, d) => s + d.yieldKwh, 0);
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const result: MonthlyData = { year, month, days, totalYieldKwh };
  toCache(_monthlyCache, key, result, isCurrentMonth ? 30 * 60_000 : 24 * 3_600_000);
  return result;
}

export interface AnnualMonth {
  month: number;
  yieldKwh: number;
}

export interface AnnualData {
  year: number;
  months: AnnualMonth[];
  totalYieldKwh: number;
}

export async function getAnnual(stationCode: string, year: number): Promise<AnnualData> {
  const key = `${stationCode}:${year}`;
  const cached = fromCache<AnnualData>(_annualCache, key);
  if (cached) return cached;

  const collectTime = new Date(`${year}-01-01T00:00:00+08:00`).getTime();
  const data = await callApi("getKpiStationYear", { stationCodes: stationCode, collectTime }) as unknown[];
  const list = Array.isArray(data) ? data : [];

  const months: AnnualMonth[] = list.map((item: any) => {
    const kpi: Record<string, unknown> = item.dataItemMap ?? {};
    return {
      month: new Date(item.collectTime).getUTCMonth() + 1,
      yieldKwh: Number(kpi.power_profit ?? 0),
    };
  });

  const totalYieldKwh = months.reduce((s, m) => s + m.yieldKwh, 0);
  const isCurrentYear = year === new Date().getFullYear();
  const result: AnnualData = { year, months, totalYieldKwh };
  toCache(_annualCache, key, result, isCurrentYear ? 60 * 60_000 : 7 * 24 * 3_600_000);
  return result;
}
