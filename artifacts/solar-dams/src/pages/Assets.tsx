import React, { useState } from "react";
import { Link } from "wouter";
import { useListAssets, useCreateAsset, useListSites } from "@workspace/api-client-react";
import { Zap, Plus, Search, Activity, PowerOff, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { getListAssetsQueryKey } from "@workspace/api-client-react";

export default function Assets() {
  const { data: assets, isLoading } = useListAssets();
  const { data: sites } = useListSites();
  const [search, setSearch] = useState("");
  const [isSheetOpen, setSheetOpen] = useState(false);

  const filtered = assets?.filter(a => 
    a.assetName.toLowerCase().includes(search.toLowerCase()) || 
    a.assetCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PV Assets</h1>
          <p className="text-muted-foreground text-sm mt-1">Solar installations, arrays, and power systems.</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-2" /> Register Asset
        </Button>
      </div>

      <div className="flex items-center border border-border bg-card rounded-md px-3 py-2 w-full max-w-sm">
        <Search className="size-4 text-muted-foreground mr-2" />
        <input 
          type="text" 
          className="bg-transparent border-none outline-none flex-1 text-sm" 
          placeholder="Search by name or code..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading PV assets...</div>
        ) : (!filtered || filtered.length === 0) ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Zap className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No assets found</h3>
            <Button onClick={() => setSheetOpen(true)} variant="outline" className="mt-4">Register Asset</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Asset Identity</th>
                  <th className="px-6 py-4 font-medium">System / Capacity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Site Link</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((asset) => {
                  const site = sites?.find(s => s.id === asset.siteId);
                  return (
                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          <Link href={`/assets/${asset.id}`}>{asset.assetName}</Link>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{asset.assetCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                          {asset.systemType.replace('_', ' ')}
                        </div>
                        <div className="text-xs font-bold text-foreground mt-0.5">
                          {asset.installedCapacityKwp ? `${asset.installedCapacityKwp} kWp` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                            ${asset.currentStatus === 'operational' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 
                              asset.currentStatus === 'fault' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                              asset.currentStatus === 'offline' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                              'bg-muted text-muted-foreground border-border'}
                          `}>
                            {asset.currentStatus === 'operational' && <Activity className="size-3" />}
                            {asset.currentStatus === 'fault' && <ShieldAlert className="size-3" />}
                            {asset.currentStatus === 'offline' && <PowerOff className="size-3" />}
                            {asset.currentStatus === 'under_maintenance' && <AlertTriangle className="size-3" />}
                            {asset.currentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {site ? (
                          <Link href={`/sites/${site.id}`} className="text-primary hover:underline text-xs font-medium">
                            {site.siteName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-xs">Orphaned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/assets/${asset.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs font-medium text-primary">Open</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateAssetSheet open={isSheetOpen} onClose={() => setSheetOpen(false)} sites={sites || []} />
    </div>
  );
}

function CreateAssetSheet({ open, onClose, sites }: { open: boolean, onClose: () => void, sites: any[] }) {
  const queryClient = useQueryClient();
  const createAsset = useCreateAsset();
  const [formData, setFormData] = useState({
    siteId: "", assetName: "", assetCode: "", systemType: "grid_tied" as const, 
    installedCapacityKwp: "", currentStatus: "operational" as const
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) return alert("Please select a site.");
    createAsset.mutate({ 
      data: { 
        ...formData, 
        siteId: Number(formData.siteId),
        installedCapacityKwp: formData.installedCapacityKwp ? Number(formData.installedCapacityKwp) : undefined
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        onClose();
      }
    });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Register PV Asset">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Location / Site <span className="text-red-500">*</span></label>
          <select required
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.siteId} onChange={e => setFormData({...formData, siteId: e.target.value})}
          >
            <option value="">Select a site...</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Asset Name <span className="text-red-500">*</span></label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.assetName} onChange={e => setFormData({...formData, assetName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Asset Code <span className="text-red-500">*</span></label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono uppercase outline-none"
              value={formData.assetCode} onChange={e => setFormData({...formData, assetCode: e.target.value.toUpperCase()})} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">System Type</label>
          <select 
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.systemType} onChange={e => setFormData({...formData, systemType: e.target.value as any})}
          >
            <option value="grid_tied">Grid Tied</option>
            <option value="hybrid">Hybrid</option>
            <option value="off_grid">Off Grid</option>
            <option value="nem">NEM</option>
            <option value="nem2">NEM 2.0</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity (kWp)</label>
            <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.installedCapacityKwp} onChange={e => setFormData({...formData, installedCapacityKwp: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Status</label>
            <select 
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.currentStatus} onChange={e => setFormData({...formData, currentStatus: e.target.value as any})}
            >
              <option value="operational">Operational</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createAsset.isPending}>Register Asset</Button>
        </div>
      </form>
    </SideSheet>
  );
}
