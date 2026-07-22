import React, { useState } from "react";
import { Link } from "wouter";
import {
  useListAssets, useListSites, createAsset, updateAsset, deleteAsset,
  getListAssetsQueryKey, ListAssetsQueryResult, ListSitesQueryResult,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, Plus, Search, Activity, PowerOff, AlertTriangle, ShieldAlert, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

type PvAsset = ListAssetsQueryResult[number];
type SiteItem = ListSitesQueryResult[number];

const BLANK_FORM = {
  siteId: "", assetName: "", assetCode: "",
  systemType: "grid_tied" as const,
  installedCapacityKwp: "",
  currentStatus: "operational" as const,
};

export default function Assets() {
  const { data: assets, isLoading } = useListAssets();
  const { data: sites } = useListSites();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PvAsset | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAsset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() }),
  });

  const handleDelete = (a: PvAsset) => {
    if (!window.confirm(`Delete asset "${a.assetName}"? This cannot be undone.`)) return;
    deleteMutation.mutate(a.id);
  };

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
        <Button onClick={() => setCreateOpen(true)}>
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
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4">Register Asset</Button>
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
                      </td>
                      <td className="px-6 py-4">
                        {site ? (
                          <Link href={`/sites/${site.id}`} className="text-primary hover:underline text-xs font-medium">
                            {site.siteName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/assets/${asset.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs font-medium text-primary">View</Button>
                          </Link>
                          <Button
                            variant="ghost" size="sm"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => setEditing(asset)}
                          >
                            <Pencil className="size-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(asset)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="size-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssetSheet mode="create" open={createOpen} onClose={() => setCreateOpen(false)} sites={(sites as SiteItem[]) || []} />
      {editing && (
        <AssetSheet mode="edit" open={!!editing} onClose={() => setEditing(null)} sites={(sites as SiteItem[]) || []} asset={editing} />
      )}
    </div>
  );
}

function AssetSheet(
  props:
    | { mode: "create"; open: boolean; onClose: () => void; sites: SiteItem[] }
    | { mode: "edit"; open: boolean; onClose: () => void; sites: SiteItem[]; asset: PvAsset }
) {
  const queryClient = useQueryClient();

  const initialForm = props.mode === "edit"
    ? {
        siteId: props.asset.siteId ? String(props.asset.siteId) : "",
        assetName: props.asset.assetName,
        assetCode: props.asset.assetCode,
        systemType: props.asset.systemType as typeof BLANK_FORM["systemType"],
        installedCapacityKwp: props.asset.installedCapacityKwp ? String(props.asset.installedCapacityKwp) : "",
        currentStatus: props.asset.currentStatus as typeof BLANK_FORM["currentStatus"],
      }
    : BLANK_FORM;

  const [formData, setFormData] = useState(initialForm);

  React.useEffect(() => {
    if (props.mode === "edit") {
      setFormData({
        siteId: props.asset.siteId ? String(props.asset.siteId) : "",
        assetName: props.asset.assetName,
        assetCode: props.asset.assetCode,
        systemType: props.asset.systemType as typeof BLANK_FORM["systemType"],
        installedCapacityKwp: props.asset.installedCapacityKwp ? String(props.asset.installedCapacityKwp) : "",
        currentStatus: props.asset.currentStatus as typeof BLANK_FORM["currentStatus"],
      });
    } else {
      setFormData(BLANK_FORM);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode === "edit" ? props.asset.id : null]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!data.siteId) throw new Error("Please select a site.");
      const payload = {
        ...data,
        siteId: Number(data.siteId),
        installedCapacityKwp: data.installedCapacityKwp ? Number(data.installedCapacityKwp) : undefined,
      };
      return props.mode === "create"
        ? createAsset(payload)
        : updateAsset((props as any).asset.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
      props.onClose();
      if (props.mode === "create") setFormData(BLANK_FORM);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) { alert("Please select a site."); return; }
    mutation.mutate(formData);
  };

  const title = props.mode === "create" ? "Register PV Asset" : `Edit — ${(props as any).asset.assetName}`;
  const submitLabel = props.mode === "create"
    ? (mutation.isPending ? "Registering..." : "Register Asset")
    : (mutation.isPending ? "Saving..." : "Save Changes");

  return (
    <SideSheet open={props.open} onClose={props.onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Location / Site <span className="text-red-500">*</span></label>
          <select required
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.siteId} onChange={e => setFormData({ ...formData, siteId: e.target.value })}
          >
            <option value="">Select a site...</option>
            {props.sites.map((s) => <option key={s.id} value={s.id}>{s.siteName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Asset Name <span className="text-red-500">*</span></label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.assetName} onChange={e => setFormData({ ...formData, assetName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Asset Code <span className="text-red-500">*</span></label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono uppercase outline-none"
              value={formData.assetCode} onChange={e => setFormData({ ...formData, assetCode: e.target.value.toUpperCase() })} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">System Type</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.systemType} onChange={e => setFormData({ ...formData, systemType: e.target.value as any })}
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
            <input type="number" step="0.01" min="0" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.installedCapacityKwp} onChange={e => setFormData({ ...formData, installedCapacityKwp: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.currentStatus} onChange={e => setFormData({ ...formData, currentStatus: e.target.value as any })}
            >
              <option value="operational">Operational</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="offline">Offline</option>
              <option value="fault">Fault</option>
            </select>
          </div>
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={props.onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{submitLabel}</Button>
        </div>
      </form>
    </SideSheet>
  );
}
