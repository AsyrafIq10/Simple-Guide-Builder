import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetAsset, useUpdateAsset, useGetSite, 
  useListEquipment, useCreateEquipment, useUpdateEquipment 
} from "@workspace/api-client-react";
import { Zap, MapPin, Edit, ArrowLeft, Plus, Settings2, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAssetQueryKey, getListEquipmentQueryKey } from "@workspace/api-client-react";

export default function AssetDetail() {
  const { id } = useParams();
  const assetId = Number(id);
  const { data: asset, isLoading: assetLoading } = useGetAsset(assetId, { query: { enabled: !!assetId, queryKey: getGetAssetQueryKey(assetId) } });
  const { data: site } = useGetSite(asset?.siteId || 0, { query: { enabled: !!asset?.siteId, queryKey: getGetAssetQueryKey(asset?.siteId || 0) } });
  const { data: equipments, isLoading: eqLoading } = useListEquipment(assetId, { query: { enabled: !!assetId, queryKey: getListEquipmentQueryKey(assetId) } });
  
  const [isEditAssetOpen, setEditAssetOpen] = useState(false);
  const [isEqSheetOpen, setEqSheetOpen] = useState(false);

  if (assetLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading...</div>;
  if (!asset) return <div className="p-8 text-destructive font-bold">Asset not found.</div>;

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

      {/* Hero Card */}
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
          <Link href={`/work-orders?asset=${asset.id}`}>
            <Button variant="secondary">Work Orders</Button>
          </Link>
          <Button onClick={() => setEditAssetOpen(true)} variant="outline">
            <Edit className="size-4 mr-2" /> Edit Asset
          </Button>
        </div>
      </div>

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
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-muted/20 px-4 py-3 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                Equipment Register
              </h3>
              <Button size="sm" variant="outline" onClick={() => setEqSheetOpen(true)}>
                <Plus className="size-3 mr-2"/> Add Component
              </Button>
            </div>
            
            <div className="p-0 flex-1">
              {eqLoading ? (
                 <div className="p-8 text-center text-muted-foreground animate-pulse">Loading equipment...</div>
              ) : (!equipments || equipments.length === 0) ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <Cpu className="size-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-sm">No equipment registered yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {equipments.map(eq => (
                    <div key={eq.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-3 group">
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
        </div>
      </div>

      <EditAssetSheet asset={asset} open={isEditAssetOpen} onClose={() => setEditAssetOpen(false)} />
      <CreateEqSheet assetId={assetId} open={isEqSheetOpen} onClose={() => setEqSheetOpen(false)} />
    </div>
  );
}

function EditAssetSheet({ asset, open, onClose }: { asset: any, open: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const updateAsset = useUpdateAsset({ assetId: asset.id });
  const [formData, setFormData] = useState({
    assetName: asset.assetName,
    assetCode: asset.assetCode,
    systemType: asset.systemType,
    installedCapacityKwp: asset.installedCapacityKwp || "",
    acCapacityKw: asset.acCapacityKw || "",
    currentStatus: asset.currentStatus
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAsset.mutate({ 
      data: {
        ...formData,
        installedCapacityKwp: formData.installedCapacityKwp ? Number(formData.installedCapacityKwp) : undefined,
        acCapacityKw: formData.acCapacityKw ? Number(formData.acCapacityKw) : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAssetQueryKey(asset.id) });
        onClose();
      }
    });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Edit Asset">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Skipping full fields for brevity, just keeping a few important ones */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select 
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.currentStatus} onChange={e => setFormData({...formData, currentStatus: e.target.value as any})}
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
            value={formData.assetName} onChange={e => setFormData({...formData, assetName: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">DC Cap (kWp)</label>
            <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.installedCapacityKwp} onChange={e => setFormData({...formData, installedCapacityKwp: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">AC Cap (kW)</label>
            <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.acCapacityKw} onChange={e => setFormData({...formData, acCapacityKw: e.target.value})} />
          </div>
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={updateAsset.isPending}>Save Changes</Button>
        </div>
      </form>
    </SideSheet>
  );
}

function CreateEqSheet({ assetId, open, onClose }: { assetId: number, open: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const createEq = useCreateEquipment({ assetId });
  const [formData, setFormData] = useState({
    equipmentType: "inverter" as const, manufacturer: "", model: "", serialNumber: "", 
    status: "operational" as const, warrantyEnd: ""
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEq.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEquipmentQueryKey(assetId) });
        onClose();
      }
    });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Add Equipment">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Equipment Type</label>
          <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.equipmentType} onChange={e => setFormData({...formData, equipmentType: e.target.value as any})}
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
              value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Serial Number</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono outline-none"
            value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Warranty End Date</label>
            <input type="date" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.warrantyEnd} onChange={e => setFormData({...formData, warrantyEnd: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="operational">Operational</option>
              <option value="faulty">Faulty</option>
            </select>
          </div>
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createEq.isPending}>Add Component</Button>
        </div>
      </form>
    </SideSheet>
  );
}
