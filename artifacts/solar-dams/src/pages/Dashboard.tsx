import React from "react";
import { Link } from "wouter";
import { 
  useGetDashboardSummary,
  useGetAssetStatusBreakdown,
  useGetRecentWorkOrders,
  useGetWarrantyExpiring
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, MapPin, Users, HardHat, AlertTriangle, ArrowRight, ShieldAlert, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: statusBreakdown, isLoading: loadingStatus } = useGetAssetStatusBreakdown();
  const { data: recentWo, isLoading: loadingWo } = useGetRecentWorkOrders();
  const { data: expiringWarranties, isLoading: loadingWarranties } = useGetWarrantyExpiring();

  if (loadingSummary || loadingStatus || loadingWo || loadingWarranties) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Total PV Assets", value: summary?.totalAssets || 0, icon: Zap, color: "text-blue-500", href: "/assets" },
    { label: "Installed Capacity", value: `${(summary?.totalInstalledKwp || 0).toLocaleString()} kWp`, icon: Activity, color: "text-amber-500", href: "/assets" },
    { label: "Total Sites", value: summary?.totalSites || 0, icon: MapPin, color: "text-teal-500", href: "/sites" },
    { label: "Open Work Orders", value: summary?.openWorkOrders || 0, icon: HardHat, color: "text-red-500", href: "/work-orders" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Portfolio overview and operational alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-bold text-foreground">{kpi.value}</h3>
              </div>
              <div className={`size-12 rounded-full bg-muted flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="size-6" />
              </div>
            </CardContent>
            <div className="px-6 py-3 bg-muted/50 border-t border-border flex justify-end">
              <Link href={kpi.href} className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="border-b border-border pb-4 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Asset Status
            </CardTitle>
            <CardDescription>Breakdown of operational states across the portfolio</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              {statusBreakdown?.map((status, idx) => (
                <div key={idx} className="flex-1 min-w-[120px] p-4 rounded-lg bg-card border border-border flex flex-col justify-center items-center text-center">
                  <span className="text-sm font-medium text-muted-foreground capitalize mb-2">{status.status.replace(/_/g, ' ')}</span>
                  <span className="text-3xl font-bold">{status.count}</span>
                </div>
              ))}
              {(!statusBreakdown || statusBreakdown.length === 0) && (
                <div className="w-full text-center py-8 text-muted-foreground">No assets found</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="border-b border-border pb-4 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overdue Work Orders</span>
                <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">{summary?.overdueWorkOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Assets without monitoring</span>
                <span className="text-sm font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{summary?.assetsWithoutMonitoring || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Warranties expiring (90 days)</span>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{summary?.warrantiesExpiringSoon || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-border">
          <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between bg-muted/20">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardHat className="size-5 text-primary" />
                Recent Work Orders
              </CardTitle>
            </div>
            <Link href="/work-orders" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {(!recentWo || recentWo.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No recent work orders.</div>
            ) : (
              <div className="divide-y border-border">
                {recentWo.map((wo) => (
                  <div key={wo.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                    <div>
                      <Link href={`/assets/${wo.assetId}`} className="font-semibold text-sm hover:underline block">{wo.workOrderNumber}</Link>
                      <span className="text-xs text-muted-foreground">{wo.type} • {wo.status}</span>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                        wo.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                        wo.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                        wo.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {wo.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between bg-muted/20">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="size-5 text-primary" />
                Expiring Warranties
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!expiringWarranties || expiringWarranties.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No warranties expiring soon.</div>
            ) : (
              <div className="divide-y border-border">
                {expiringWarranties.map((eq) => (
                  <div key={eq.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{eq.manufacturer} {eq.model}</div>
                      <span className="text-xs text-muted-foreground">SN: {eq.serialNumber}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-red-500">Exp: {eq.warrantyEnd}</div>
                      <div className="text-xs text-muted-foreground uppercase">{eq.equipmentType.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
