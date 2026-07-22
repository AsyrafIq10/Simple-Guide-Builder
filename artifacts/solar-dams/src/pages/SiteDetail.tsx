import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetSite, useListAssets, useGetCustomer, updateSite, getGetSiteQueryKey, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Zap, Edit, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

export default function SiteDetail() {
  const { id } = useParams();
  const siteId = Number(id);
  const { data: site, isLoading: siteLoading } = useGetSite(siteId, { query: { enabled: !!siteId, queryKey: getGetSiteQueryKey(siteId) } });
  const { data: assets, isLoading: assetsLoading } = useListAssets();
  const { data: customer } = useGetCustomer(site?.customerId || 0, { query: { enabled: !!site?.customerId, queryKey: getGetCustomerQueryKey(site?.customerId || 0) } });

  const [isEditOpen, setEditOpen] = useState(false);

  if (siteLoading || assetsLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading...</div>;
  if (!site) return <div className="p-8 text-destructive font-bold">Site not found.</div>;

  const siteAssets = assets?.filter(a => a.siteId === siteId) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/sites">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <span className="text-sm font-medium text-muted-foreground">Back to Sites</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20">
            <MapPin className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{site.siteName}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                ${site.status === 'active' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                  site.status === 'under_construction' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                  'bg-muted text-muted-foreground border-border'}
              `}>
                {site.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="font-mono uppercase text-primary font-semibold">{site.siteCode}</span>
              <span>•</span>
              <span className="uppercase text-xs tracking-wider">{site.siteType.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        <Button onClick={() => setEditOpen(true)} variant="outline">
          <Edit className="size-4 mr-2" /> Edit Details
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-muted/20 px-4 py-3 border-b border-border font-semibold text-sm">Site Information</div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Address</div>
                <div className="text-foreground">{site.address}</div>
              </div>

              {customer && (
                <div className="pt-3 border-t border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Owned By</div>
                  <Link href={`/customers/${customer.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded border border-border bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer">
                      <Building2 className="size-4 text-primary" />
                      <span className="font-medium text-primary">{customer.name}</span>
                    </div>
                  </Link>
                </div>
              )}

              {(site.gridRegion || site.utilityProvider) && (
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-4">
                  {site.gridRegion && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Grid Region</div>
                      <div className="font-medium">{site.gridRegion}</div>
                    </div>
                  )}
                  {site.utilityProvider && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Utility</div>
                      <div className="font-medium">{site.utilityProvider}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">PV Assets at Location</h3>
            <Link href="/assets">
              <Button size="sm" variant="outline">Manage Assets</Button>
            </Link>
          </div>

          {siteAssets.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
              <Zap className="size-8 mx-auto mb-3 opacity-20" />
              <p>No solar assets registered at this site yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {siteAssets.map(asset => (
                <Link key={asset.id} href={`/assets/${asset.id}`}>
                  <div className="bg-card border border-border hover:border-primary/50 transition-colors rounded-xl p-4 shadow-sm flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Zap className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold group-hover:text-primary transition-colors text-base">{asset.assetName}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                          <span>{asset.assetCode}</span>
                          <span>•</span>
                          <span>{asset.systemType.replace('_', ' ')}</span>
                          {asset.installedCapacityKwp && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-foreground">{asset.installedCapacityKwp} kWp</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border
                      ${asset.currentStatus === 'operational' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                        asset.currentStatus === 'fault' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        asset.currentStatus === 'offline' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        'bg-muted text-muted-foreground border-border'}
                    `}>
                      {asset.currentStatus}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <EditSiteSheet site={site} open={isEditOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function EditSiteSheet({ site, open, onClose }: { site: any; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => updateSite(site.id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(getGetSiteQueryKey(site.id), updated);
      onClose();
    },
  });
  const [formData, setFormData] = useState({
    siteName: site.siteName,
    siteCode: site.siteCode,
    address: site.address,
    status: site.status,
    gridRegion: site.gridRegion || "",
    utilityProvider: site.utilityProvider || "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Edit Site">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Site Name</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.siteName} onChange={e => setFormData({ ...formData, siteName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="active">Active</option>
            <option value="under_construction">Under Construction</option>
            <option value="inactive">Inactive</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Grid Region</label>
            <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.gridRegion} onChange={e => setFormData({ ...formData, gridRegion: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Utility Provider</label>
            <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.utilityProvider} onChange={e => setFormData({ ...formData, utilityProvider: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Address</label>
          <textarea required className="w-full p-3 rounded-md border border-input bg-background text-sm min-h-[80px] outline-none"
            value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>Save Changes</Button>
        </div>
      </form>
    </SideSheet>
  );
}
