import React, { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import {
  useGetAsset, useGetSite, useListEquipment,
  updateAsset, createEquipment,
  getGetAssetQueryKey, getGetSiteQueryKey, getListEquipmentQueryKey,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Zap, MapPin, Edit, ArrowLeft, Plus, Settings2, ShieldCheck, Cpu, Camera, FileText, Upload, Trash2, QrCode, Download, Activity, Sun, TrendingUp, BarChart3, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";
import QRCode from "react-qr-code";
import {
  AreaChart, Area, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const BASE = "/api";

async function listAttachments(entityType: string, entityId: number) {
  const r = await fetch(`${BASE}/attachments?entityType=${entityType}&entityId=${entityId}`);
  if (!r.ok) throw new Error("Failed to load attachments");
  return r.json() as Promise<any[]>;
}

async function deleteAttachment(id: number) {
  await fetch(`${BASE}/attachments/${id}`, { method: "DELETE" });
}

function useAttachments(entityType: string, entityId: number) {
  const qc = useQueryClient();
  const key = ["attachments", entityType, entityId];
  const query = useQuery({ queryKey: key, queryFn: () => listAttachments(entityType, entityId), enabled: !!entityId });
  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  return { ...query, invalidate };
}

function AttachmentUploader({
  entityType, entityId, category, onDone
}: { entityType: string; entityId: number; category: string; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const urlRes = await fetch(`${BASE}/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      const attRes = await fetch(`${BASE}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, category, fileName: file.name, objectPath, mimeType: file.type }),
      });
      if (!attRes.ok) throw new Error("Failed to save attachment");
      onDone();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file"
        accept={category === "photo" ? "image/*" : "image/*,application/pdf,.dwg,.dxf,.svg"}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
        <Upload className="size-3 mr-2" />{uploading ? "Uploading..." : `Add ${category === "photo" ? "Photo" : "Drawing"}`}
      </Button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function AttachmentGrid({ attachments, onDelete }: { attachments: any[]; onDelete: (id: number) => void }) {
  if (attachments.length === 0) return (
    <div className="py-8 text-center text-muted-foreground text-sm">No files uploaded yet.</div>
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {attachments.map(att => {
        const isImage = att.mimeType?.startsWith("image/");
        const url = `/api/storage${att.objectPath}`;
        return (
          <div key={att.id} className="group relative border border-border rounded-lg overflow-hidden bg-muted/20">
            {isImage ? (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={att.fileName} className="w-full h-28 object-cover" />
              </a>
            ) : (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center h-28 gap-2 hover:bg-muted/40 transition-colors">
                <FileText className="size-8 text-muted-foreground" />
                <span className="text-xs text-center text-muted-foreground px-2 line-clamp-2">{att.fileName}</span>
              </a>
            )}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="destructive" className="size-6"
                onClick={() => onDelete(att.id)}>
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="px-2 py-1 border-t border-border">
              <p className="text-[10px] text-muted-foreground truncate">{att.fileName}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetQrCard({ asset }: { asset: any }) {
  const qrValue = `${window.location.origin}/assets/${asset.id}`;

  const downloadQr = () => {
    const svg = document.getElementById(`qr-${asset.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `${asset.assetCode}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-muted/20 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <QrCode className="size-4 text-primary" /> QR Code
        </h3>
        <Button size="sm" variant="outline" onClick={downloadQr}>
          <Download className="size-3 mr-2" /> PNG
        </Button>
      </div>
      <div className="p-4 flex flex-col items-center gap-3">
        <div className="bg-white p-3 rounded-lg border border-border">
          <QRCode id={`qr-${asset.id}`} value={qrValue} size={140} />
        </div>
        <div className="text-center">
          <div className="font-mono text-xs font-bold text-primary">{asset.assetCode}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Scan to open asset record</div>
        </div>
      </div>
    </div>
  );
}

// ─── Monitoring components ────────────────────────────────────────────────────

function KpiCard({ title, value, icon: Icon, color }: {
  title: string; value: string | null; icon: React.ElementType;
  color: "blue" | "amber" | "green" | "purple";
}) {
  const cls = {
    blue:   "bg-blue-50 text-blue-600 border-blue-100",
    amber:  "bg-amber-50 text-amber-600 border-amber-100",
    green:  "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-violet-50 text-violet-600 border-violet-100",
  }[color];
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`size-9 rounded-lg flex items-center justify-center border shrink-0 ${cls}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{title}</div>
        <div className="font-bold text-lg leading-tight">
          {value ?? <span className="text-muted-foreground/40 text-sm animate-pulse">—</span>}
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  generating: "text-emerald-600 bg-emerald-50 border-emerald-200",
  standby:    "text-amber-600  bg-amber-50  border-amber-200",
  fault:      "text-red-600   bg-red-50   border-red-200",
  offline:    "text-gray-500  bg-gray-100 border-gray-200",
  unknown:    "text-gray-400  bg-gray-50  border-gray-100",
};

function MonitoringTab({ assetId, fusionSolarStationCode }: {
  assetId: number; fusionSolarStationCode?: string | null;
}) {
  const now = new Date();
  const [selDate,  setSelDate]  = useState(now.toISOString().slice(0, 10));
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [annYear,  setAnnYear]  = useState(now.getFullYear());

  const base = `/api/monitoring/${assetId}`;

  const rtQ = useQuery({
    queryKey: ["monitoring", assetId, "realtime"],
    queryFn: async () => { const r = await fetch(`${base}/realtime`); if (!r.ok) throw new Error((await r.json()).error); return r.json(); },
    enabled: !!fusionSolarStationCode,
    refetchInterval: 60_000,
    retry: 1,
  });
  const dayQ = useQuery({
    queryKey: ["monitoring", assetId, "daily", selDate],
    queryFn: async () => { const r = await fetch(`${base}/daily?date=${selDate}`); if (!r.ok) throw new Error((await r.json()).error); return r.json(); },
    enabled: !!fusionSolarStationCode,
  });
  const monQ = useQuery({
    queryKey: ["monitoring", assetId, "monthly", selYear, selMonth],
    queryFn: async () => { const r = await fetch(`${base}/monthly?year=${selYear}&month=${selMonth}`); if (!r.ok) throw new Error((await r.json()).error); return r.json(); },
    enabled: !!fusionSolarStationCode,
  });
  const annQ = useQuery({
    queryKey: ["monitoring", assetId, "annual", annYear],
    queryFn: async () => { const r = await fetch(`${base}/annual?year=${annYear}`); if (!r.ok) throw new Error((await r.json()).error); return r.json(); },
    enabled: !!fusionSolarStationCode,
  });

  if (!fusionSolarStationCode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 border border-blue-100">
          <Activity className="size-8 text-blue-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">FusionSolar Not Linked</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Link this asset to a FusionSolar plant to see live power, performance ratio, and historical production.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-4 bg-muted/40 px-3 py-1.5 rounded-lg">
          Click <strong>Edit Asset</strong> → enter the <strong>FusionSolar Station Code</strong>
        </p>
      </div>
    );
  }

  const rt = rtQ.data;
  const statusStyle = STATUS_STYLE[rt?.status ?? "unknown"];

  return (
    <div className="space-y-5">
      {/* Status bar + live KPI cards */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          {rtQ.isLoading ? (
            <span className="text-xs text-muted-foreground animate-pulse">Connecting to FusionSolar…</span>
          ) : rtQ.isError ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <AlertCircle className="size-3" /> {(rtQ.error as Error).message}
            </span>
          ) : (
            <>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusStyle}`}>
                <span className="size-1.5 rounded-full bg-current animate-pulse" />
                {rt?.status?.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">Live · refreshes every 60 s</span>
              <button onClick={() => rtQ.refetch()} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={`size-3.5 ${rtQ.isFetching ? "animate-spin" : ""}`} />
              </button>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard title="Power Now"       value={rt ? `${rt.powerKw.toFixed(2)} kW`                        : null} icon={Zap}        color="blue" />
          <KpiCard title="Today's Yield"   value={rt ? `${rt.todayYieldKwh.toFixed(1)} kWh`                 : null} icon={Sun}        color="amber" />
          <KpiCard title="Performance Ratio" value={rt ? `${(rt.performanceRatio * 100).toFixed(1)} %`       : null} icon={TrendingUp} color="green" />
          <KpiCard title="Lifetime Yield"  value={rt ? `${rt.totalYieldMwh.toFixed(2)} MWh`                 : null} icon={BarChart3}  color="purple" />
        </div>
      </div>

      {/* Daily power curve */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-semibold text-sm">Daily Power Curve</h3>
          <input type="date" value={selDate} max={now.toISOString().slice(0, 10)}
            onChange={e => setSelDate(e.target.value)}
            className="text-xs border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary bg-background" />
        </div>
        {dayQ.isLoading ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground animate-pulse">Loading…</div>
        ) : (dayQ.data?.points?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dayQ.data.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pwrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="timeLabel" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit=" kW" width={46} />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)} kW`, "Power"]} />
              <Area type="monotone" dataKey="powerKw" stroke="#3b82f6" strokeWidth={2} fill="url(#pwrGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data for this date</div>
        )}
        {dayQ.data && (
          <div className="flex gap-6 mt-3 text-sm text-muted-foreground pt-3 border-t border-border">
            <span>Total <strong className="text-foreground">{dayQ.data.totalYieldKwh?.toFixed(1)} kWh</strong></span>
            <span>Peak <strong className="text-foreground">{dayQ.data.peakPowerKw?.toFixed(2)} kW</strong></span>
          </div>
        )}
      </div>

      {/* Monthly chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-semibold text-sm">Monthly Production</h3>
          <div className="flex gap-2">
            <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
              className="text-xs border border-border rounded-lg px-2.5 py-1.5 outline-none bg-background">
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <input type="number" value={selYear} min={2018} max={2035}
              onChange={e => setSelYear(Number(e.target.value))}
              className="w-20 text-xs border border-border rounded-lg px-2.5 py-1.5 outline-none bg-background" />
          </div>
        </div>
        {monQ.isLoading ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground animate-pulse">Loading…</div>
        ) : (monQ.data?.days?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monQ.data.days} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={d => d.slice(8)} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit=" kWh" width={50} />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)} kWh`, "Yield"]}
                labelFormatter={l => `Day ${String(l).slice(8)}`} />
              <Bar dataKey="yieldKwh" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data</div>
        )}
        {monQ.data && (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
            Total <strong className="text-foreground">{monQ.data.totalYieldKwh?.toFixed(1)} kWh</strong>
          </p>
        )}
      </div>

      {/* Annual chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-semibold text-sm">Annual Production</h3>
          <input type="number" value={annYear} min={2018} max={2035}
            onChange={e => setAnnYear(Number(e.target.value))}
            className="w-20 text-xs border border-border rounded-lg px-2.5 py-1.5 outline-none bg-background" />
        </div>
        {annQ.isLoading ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground animate-pulse">Loading…</div>
        ) : (annQ.data?.months?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={annQ.data.months} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={m => ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m as number]} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit=" kWh" width={55} />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(0)} kWh`, "Yield"]}
                labelFormatter={m => ["","January","February","March","April","May","June","July","August","September","October","November","December"][m as number]} />
              <Bar dataKey="yieldKwh" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data</div>
        )}
        {annQ.data && (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
            Total <strong className="text-foreground">{annQ.data.totalYieldKwh?.toFixed(0)} kWh</strong> ({annYear})
          </p>
        )}
      </div>

      {rt?.temperatureC != null && (
        <p className="text-xs text-muted-foreground/70 text-right">
          Inverter temp: {rt.temperatureC.toFixed(1)} °C
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssetDetail() {
  const { id } = useParams();
  const assetId = Number(id);
  const { data: asset, isLoading: assetLoading } = useGetAsset(assetId, { query: { enabled: !!assetId, queryKey: getGetAssetQueryKey(assetId) } });
  const { data: site } = useGetSite(asset?.siteId || 0, { query: { enabled: !!asset?.siteId, queryKey: getGetSiteQueryKey(asset?.siteId || 0) } });
  const { data: equipments, isLoading: eqLoading } = useListEquipment(assetId, { query: { enabled: !!assetId, queryKey: getListEquipmentQueryKey(assetId) } });
  const { data: photos, invalidate: invalidatePhotos } = useAttachments("asset", assetId);
  const { data: drawings, invalidate: invalidateDrawings } = useAttachments("asset", assetId);
  const [attTab, setAttTab] = useState<"photo" | "drawing">("photo");
  const [mainTab, setMainTab] = useState<"overview" | "monitoring">("overview");

  const [isEditAssetOpen, setEditAssetOpen] = useState(false);
  const [isEqSheetOpen, setEqSheetOpen] = useState(false);

  const handleDeleteAtt = async (id: number) => {
    if (!window.confirm("Delete this file?")) return;
    await deleteAttachment(id);
    invalidatePhotos();
    invalidateDrawings();
  };

  if (assetLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading...</div>;
  if (!asset) return <div className="p-8 text-destructive font-bold">Asset not found.</div>;

  const filteredAtt = (attTab === "photo" ? photos : drawings)?.filter(a => a.category === attTab) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/assets">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <span className="text-sm font-medium text-muted-foreground">Back to Assets</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
            <Zap className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{asset.assetName}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                ${asset.currentStatus === 'operational' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                  asset.currentStatus === 'fault' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-muted text-muted-foreground border-border'}
              `}>
                {asset.currentStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="font-mono uppercase text-primary font-semibold">{asset.assetCode}</span>
              <span>•</span>
              <span className="uppercase text-xs tracking-wider">{asset.systemType.replace('_', ' ')}</span>
              {asset.installedCapacityKwp && (
                <>
                  <span>•</span>
                  <span className="font-bold text-foreground">{asset.installedCapacityKwp} kWp</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/work-orders`}>
            <Button variant="secondary">Work Orders</Button>
          </Link>
          <Button onClick={() => setEditAssetOpen(true)} variant="outline">
            <Edit className="size-4 mr-2" /> Edit Asset
          </Button>
        </div>
      </div>

      {/* Main tab nav */}
      <div className="flex gap-1 border-b border-border">
        {(["overview", "monitoring"] as const).map(tab => (
          <button key={tab} onClick={() => setMainTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors rounded-t-lg
              ${mainTab === tab
                ? "bg-card text-foreground border border-b-0 border-border -mb-px"
                : "text-muted-foreground hover:text-foreground"}`}>
            {tab === "monitoring" ? "⚡ Live Monitoring" : "📋 Overview"}
          </button>
        ))}
      </div>

      {mainTab === "monitoring" ? (
        <MonitoringTab assetId={assetId} fusionSolarStationCode={(asset as any).fusionSolarStationCode} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-muted/20 px-4 py-3 border-b border-border font-semibold text-sm">System Specifications</div>
            <div className="p-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">DC Capacity</div>
                  <div className="font-bold text-base">{asset.installedCapacityKwp ? `${asset.installedCapacityKwp} kWp` : '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">AC Capacity</div>
                  <div className="font-bold text-base">{asset.acCapacityKw ? `${asset.acCapacityKw} kW` : '-'}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Interconnection</div>
                <div className="font-medium">{asset.interconnectionType || '-'}</div>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Commissioned</div>
                <div className="font-medium">{asset.commissioningDate || 'Not recorded'}</div>
              </div>

              {site && (
                <div className="pt-3 border-t border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Location</div>
                  <Link href={`/sites/${site.id}`}>
                    <div className="flex items-start gap-2 p-2 rounded border border-border bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer">
                      <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-primary text-sm leading-tight">{site.siteName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{site.address}</div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <AssetQrCard asset={asset} />
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-muted/20 px-4 py-3 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                Equipment Register
              </h3>
              <Button size="sm" variant="outline" onClick={() => setEqSheetOpen(true)}>
                <Plus className="size-3 mr-2" /> Add Component
              </Button>
            </div>

            <div className="p-0 flex-1">
              {eqLoading ? (
                <div className="p-8 text-center text-muted-foreground animate-pulse">Loading equipment...</div>
              ) : (!equipments || equipments.length === 0) ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Cpu className="size-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-sm">No equipment registered yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {equipments.map(eq => (
                    <div key={eq.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded bg-muted/50 border border-border flex items-center justify-center mt-1">
                          <Cpu className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{eq.manufacturer} {eq.model}</span>
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border
                              ${eq.status === 'operational' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                                eq.status === 'faulty' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-muted text-muted-foreground border-border'}
                            `}>
                              {eq.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span className="uppercase tracking-wider font-medium text-primary/80">{eq.equipmentType.replace('_', ' ')}</span>
                            <span className="font-mono bg-muted px-1 rounded">SN: {eq.serialNumber}</span>
                            {eq.ratedCapacity && <span>Cap: {eq.ratedCapacity}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {eq.warrantyEnd && (
                          <div className="text-xs flex items-center gap-1 justify-end text-muted-foreground">
                            <ShieldCheck className="size-3" />
                            Exp: <span className="font-medium text-foreground">{eq.warrantyEnd}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-muted/20 px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">Attachments</span>
              <AttachmentUploader
                entityType="asset" entityId={assetId} category={attTab}
                onDone={() => { invalidatePhotos(); invalidateDrawings(); }}
              />
            </div>
            <div className="flex border-b border-border">
              <button
                onClick={() => setAttTab("photo")}
                className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5
                  ${attTab === "photo" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Camera className="size-3" /> Photos
              </button>
              <button
                onClick={() => setAttTab("drawing")}
                className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5
                  ${attTab === "drawing" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <FileText className="size-3" /> Drawings
              </button>
            </div>
            <div className="p-4">
              <AttachmentGrid attachments={filteredAtt} onDelete={handleDeleteAtt} />
            </div>
          </div>
        </div>
      </div>
      )}

      <EditAssetSheet asset={asset} open={isEditAssetOpen} onClose={() => setEditAssetOpen(false)} />
      <CreateEqSheet assetId={assetId} open={isEqSheetOpen} onClose={() => setEqSheetOpen(false)} />
    </div>
  );
}

function EditAssetSheet({ asset, open, onClose }: { asset: any; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => updateAsset(asset.id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(getGetAssetQueryKey(asset.id), updated);
      onClose();
    },
  });
  const [formData, setFormData] = useState({
    assetName: asset.assetName,
    systemType: asset.systemType,
    installedCapacityKwp: asset.installedCapacityKwp || "",
    acCapacityKw: asset.acCapacityKw || "",
    currentStatus: asset.currentStatus,
    fusionSolarStationCode: (asset as any).fusionSolarStationCode || "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      installedCapacityKwp: formData.installedCapacityKwp ? Number(formData.installedCapacityKwp) : undefined,
      acCapacityKw: formData.acCapacityKw ? Number(formData.acCapacityKw) : undefined,
      fusionSolarStationCode: formData.fusionSolarStationCode || undefined,
    });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Edit Asset">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.currentStatus} onChange={e => setFormData({ ...formData, currentStatus: e.target.value as any })}
          >
            <option value="operational">Operational</option>
            <option value="under_maintenance">Under Maintenance</option>
            <option value="fault">Fault</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Asset Name</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.assetName} onChange={e => setFormData({ ...formData, assetName: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">DC Cap (kWp)</label>
            <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.installedCapacityKwp} onChange={e => setFormData({ ...formData, installedCapacityKwp: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">AC Cap (kW)</label>
            <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.acCapacityKw} onChange={e => setFormData({ ...formData, acCapacityKw: e.target.value })} />
          </div>
        </div>

        {/* FusionSolar integration */}
        <div className="pt-2 border-t border-border space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Activity className="size-3.5 text-amber-500" /> FusionSolar Station Code
          </label>
          <input
            type="text"
            placeholder="e.g. NE=12345678"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono outline-none focus:border-primary"
            value={formData.fusionSolarStationCode}
            onChange={e => setFormData({ ...formData, fusionSolarStationCode: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground">
            Find in FusionSolar Portal → Plant List → tap the plant → copy the station code from the URL or plant details.
          </p>
        </div>

        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>Save Changes</Button>
        </div>
      </form>
    </SideSheet>
  );
}

function CreateEqSheet({ assetId, open, onClose }: { assetId: number; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => createEquipment(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListEquipmentQueryKey(assetId) });
      onClose();
    },
  });
  const [formData, setFormData] = useState({
    equipmentType: "inverter" as const,
    manufacturer: "", model: "", serialNumber: "",
    status: "operational" as const, warrantyEnd: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Add Equipment">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Equipment Type</label>
          <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.equipmentType} onChange={e => setFormData({ ...formData, equipmentType: e.target.value as any })}
          >
            <option value="inverter">Inverter</option>
            <option value="pv_module">PV Module</option>
            <option value="meter">Meter</option>
            <option value="sensor">Sensor</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Manufacturer</label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Serial Number</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono outline-none"
            value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Warranty End Date</label>
            <input type="date" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.warrantyEnd} onChange={e => setFormData({ ...formData, warrantyEnd: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="operational">Operational</option>
              <option value="faulty">Faulty</option>
            </select>
          </div>
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>Add Component</Button>
        </div>
      </form>
    </SideSheet>
  );
}
