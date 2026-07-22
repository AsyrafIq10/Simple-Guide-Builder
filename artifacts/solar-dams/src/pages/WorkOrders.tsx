import React, { useState } from "react";
import { Link } from "wouter";
import { useListWorkOrders, useCreateWorkOrder, useListAssets } from "@workspace/api-client-react";
import { HardHat, Plus, Search, Calendar, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { getListWorkOrdersQueryKey } from "@workspace/api-client-react";

export default function WorkOrders() {
  const { data: wos, isLoading } = useListWorkOrders();
  const { data: assets } = useListAssets();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isSheetOpen, setSheetOpen] = useState(false);

  const filtered = wos?.filter(wo => {
    if (activeTab !== "all" && wo.status !== activeTab && !(activeTab === 'active' && !['closed', 'cancelled'].includes(wo.status))) return false;
    return wo.workOrderNumber.toLowerCase().includes(search.toLowerCase()) || 
           wo.description.toLowerCase().includes(search.toLowerCase());
  });

  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "scheduled", label: "Scheduled" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Maintenance, inspections, and corrective actions.</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-2" /> New Work Order
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border p-2 rounded-lg shadow-sm">
        <div className="flex overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors
                ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center border border-border bg-background rounded-md px-3 py-2 w-full sm:w-64 shrink-0">
          <Search className="size-4 text-muted-foreground mr-2" />
          <input 
            type="text" 
            className="bg-transparent border-none outline-none flex-1 text-sm w-full" 
            placeholder="Search work orders..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading work orders...</div>
        ) : (!filtered || filtered.length === 0) ? (
          <div className="p-12 text-center flex flex-col items-center">
            <HardHat className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No work orders found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">WO Number</th>
                  <th className="px-6 py-4 font-medium">Description / Asset</th>
                  <th className="px-6 py-4 font-medium">Priority & Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((wo) => {
                  const asset = assets?.find(a => a.id === wo.assetId);
                  return (
                    <tr key={wo.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold font-mono text-foreground">{wo.workOrderNumber}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="size-3" /> {wo.scheduledDate || 'Unscheduled'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground line-clamp-1 max-w-[300px]">{wo.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {asset ? (
                            <Link href={`/assets/${asset.id}`} className="hover:underline text-primary">{asset.assetName}</Link>
                          ) : 'Unknown Asset'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider
                            ${wo.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                              wo.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                              wo.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                              'bg-gray-500/10 text-gray-500'
                            }
                          `}>
                            {wo.priority}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">{wo.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {wo.status === 'completed' || wo.status === 'verified' ? <CheckCircle2 className="size-4 text-teal-500" /> :
                           wo.status === 'in_progress' ? <Clock className="size-4 text-blue-500" /> :
                           wo.status === 'scheduled' ? <Calendar className="size-4 text-purple-500" /> :
                           ['open', 'assigned', 'draft'].includes(wo.status) ? <ShieldAlert className="size-4 text-amber-500" /> :
                           <div className="size-4 rounded-full bg-muted border border-border" />
                          }
                          <span className="font-medium capitalize text-xs">{wo.status.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{wo.assignedTo || 'Unassigned'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateWoSheet open={isSheetOpen} onClose={() => setSheetOpen(false)} assets={assets || []} />
    </div>
  );
}

function CreateWoSheet({ open, onClose, assets }: { open: boolean, onClose: () => void, assets: any[] }) {
  const queryClient = useQueryClient();
  const createWo = useCreateWorkOrder();
  const [formData, setFormData] = useState({
    assetId: "", type: "preventive" as const, priority: "medium" as const, 
    description: "", assignedTo: "", scheduledDate: "", status: "draft" as const
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId) return alert("Please select an asset.");
    createWo.mutate({ 
      data: { ...formData, assetId: Number(formData.assetId) } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkOrdersQueryKey() });
        onClose();
      }
    });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="New Work Order">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Asset <span className="text-red-500">*</span></label>
          <select required
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})}
          >
            <option value="">Select an asset...</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.assetName} ({a.assetCode})</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Issue Description <span className="text-red-500">*</span></label>
          <textarea required className="w-full p-3 rounded-md border border-input bg-background text-sm min-h-[100px] outline-none"
            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}
            >
              <option value="preventive">Preventive</option>
              <option value="corrective">Corrective</option>
              <option value="emergency">Emergency</option>
              <option value="inspection">Inspection</option>
              <option value="warranty">Warranty</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              placeholder="e.g. Ali bin Ahmad"
              value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Scheduled Date</label>
            <input type="date" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
            <label className="text-sm font-medium">Initial Status</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createWo.isPending}>Create Work Order</Button>
        </div>
      </form>
    </SideSheet>
  );
}
