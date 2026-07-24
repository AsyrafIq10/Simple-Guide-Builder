---
name: FusionSolar Module 2 — Live Monitoring
description: Digital twin dashboard implementation status and secrets needed to activate it
---

# FusionSolar Module 2 — Live Monitoring

## Status
UI is complete and renders. API proxy routes exist. Waiting for user to supply credentials.

## Secrets Required (not yet set)
- `FUSIONSOLAR_USERNAME` — FusionSolar portal login
- `FUSIONSOLAR_SYSTEM_CODE` — Northbound API system code (FusionSolar Portal → System Settings → Third-Party Access)
- `FUSIONSOLAR_BASE_URL` — regional endpoint; default `https://sg5.fusionsolar.huawei.com` (SE Asia)

**Why:** The API server (`artifacts/api-server/src/lib/fusionSolar.ts`) reads these at startup. Without them the monitoring endpoints return errors; the UI shows a "not configured" state.

## Architecture
- Backend proxy in `artifacts/api-server/src/routes/monitoring.ts` (4 routes: realtime/daily/monthly/annual)
- In-memory cache: 1 min realtime, 5 min daily, 30 min monthly, 1 h annual
- FusionSolar session: XSRF-TOKEN cookie + `roarand` header, 28-min TTL with auto re-login
- Asset → Station mapping: `fusionSolarStationCode` column on `pv_assets` table (nullable)

## Outstanding
- User needs to enter `fusionSolarStationCode` via Edit Asset sheet to link an asset to FusionSolar
- Production DB migration still needed (push `fusion_solar_station_code` column + `attachments` table)
- Republish after credentials are set
