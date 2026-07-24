import React, { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import {
  useGetAsset, useGetSite, useListEquipment,
  updateAsset, createEquipment,
  getGetAssetQueryKey, getGetSiteQueryKey, getListEquipmentQueryKey,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Zap, MapPin, Edit, ArrowLeft, Plus, Settings2, ShieldCheck, Cpu, Camera, FileText, Upload, Trash2, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";
import QRCode from "react-qr-code";

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

export default function AssetDetail() {
  const { id } = useParams();
  const assetId = Number(id);
  const { data: asset, isLoading: assetLoading } = useGetAsset(assetId, { query: { enabled: !!assetId, queryKey: getGetAssetQueryKey(assetId) } });
  const { data: site } = useGetSite(asset?.siteId || 0, { query: { enabled: !!asset?.siteId, queryKey: getGetSiteQueryKey(asset?.siteId || 0) } });
  const { data: equipments, isLoading: eqLoading } = useListEquipment(assetId, { query: { enabled: !!assetId, queryKey: getListEquipmentQueryKey(assetId) } });
  const { data: photos, invalidate: invalidatePhotos } = useAttachments("asset", assetId);
  const { data: drawings, invalidate: invalidateDrawings } = useAttachments("asset", assetId);
  const [attTab, setAttTab] = useState<"photo" | "drawing">("photo");

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
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      installedCapacityKwp: formData.installedCapacityKwp ? Number(formData.installedCapacityKwp) : undefined,
      acCapacityKw: formData.acCapacityKw ? Number(formData.acCapacityKw) : undefined,
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
