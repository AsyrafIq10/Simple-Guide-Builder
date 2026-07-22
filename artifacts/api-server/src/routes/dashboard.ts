import { Router, type IRouter } from "express";
import { db, customersTable, sitesTable, pvAssetsTable, equipmentTable, workOrdersTable } from "@workspace/db";
import { sql, count, eq, lte } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetRecentWorkOrdersResponse,
  GetAssetStatusBreakdownResponse,
  GetWarrantyExpiringResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [[assetRow], [siteRow], [customerRow], [openWoRow], [overdueWoRow], [noMonRow], [expiringRow]] = await Promise.all([
    db.select({ total: count(), totalKwp: sql<string>`sum(${pvAssetsTable.installedCapacityKwp})` }).from(pvAssetsTable),
    db.select({ total: count() }).from(sitesTable),
    db.select({ total: count() }).from(customersTable),
    db.select({ total: count() }).from(workOrdersTable).where(
      sql`${workOrdersTable.status} NOT IN ('completed','verified','closed','cancelled')`
    ),
    db.select({ total: count() }).from(workOrdersTable).where(
      sql`${workOrdersTable.status} NOT IN ('completed','verified','closed','cancelled') AND ${workOrdersTable.scheduledDate} IS NOT NULL AND ${workOrdersTable.scheduledDate} < CURRENT_DATE::text`
    ),
    db.select({ total: count() }).from(pvAssetsTable).where(eq(pvAssetsTable.monitoringStatus, "not_configured")),
    db.select({ total: count() }).from(equipmentTable).where(
      sql`${equipmentTable.warrantyEnd} IS NOT NULL AND ${equipmentTable.warrantyEnd} <= (CURRENT_DATE + INTERVAL '90 days')::text AND ${equipmentTable.warrantyEnd} >= CURRENT_DATE::text`
    ),
  ]);

  const summary = {
    totalAssets: Number(assetRow.total),
    totalInstalledKwp: assetRow.totalKwp ? Number(assetRow.totalKwp) : 0,
    totalSites: Number(siteRow.total),
    totalCustomers: Number(customerRow.total),
    openWorkOrders: Number(openWoRow.total),
    overdueWorkOrders: Number(overdueWoRow.total),
    warrantiesExpiringSoon: Number(expiringRow.total),
    assetsWithoutMonitoring: Number(noMonRow.total),
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/recent-work-orders", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(workOrdersTable)
    .orderBy(sql`${workOrdersTable.createdAt} DESC`)
    .limit(10);
  const dtos = rows.map(r => ({
    ...r,
    labourCost: r.labourCost ? Number(r.labourCost) : null,
    materialCost: r.materialCost ? Number(r.materialCost) : null,
    totalCost: r.totalCost ? Number(r.totalCost) : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
  }));
  res.json(GetRecentWorkOrdersResponse.parse(dtos));
});

router.get("/dashboard/asset-status-breakdown", async (req, res): Promise<void> => {
  const rows = await db
    .select({ status: pvAssetsTable.currentStatus, count: count() })
    .from(pvAssetsTable)
    .groupBy(pvAssetsTable.currentStatus);
  res.json(GetAssetStatusBreakdownResponse.parse(rows.map(r => ({ status: r.status, count: Number(r.count) }))));
});

router.get("/dashboard/warranty-expiring", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(equipmentTable)
    .where(
      sql`${equipmentTable.warrantyEnd} IS NOT NULL AND ${equipmentTable.warrantyEnd} <= (CURRENT_DATE + INTERVAL '90 days')::text AND ${equipmentTable.warrantyEnd} >= CURRENT_DATE::text`
    )
    .orderBy(equipmentTable.warrantyEnd)
    .limit(20);
  res.json(GetWarrantyExpiringResponse.parse(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
  }))));
});

export default router;
