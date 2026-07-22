import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetDeveloperProject, useGetDeveloperProjectSummary, 
  useListHousingUnits, useCreateHousingUnit, useUpdateDeveloperProject 
} from "@workspace/api-client-react";
import { Home, ArrowLeft, Plus, Search, Edit, CheckCircle2, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDeveloperProjectQueryKey, getListHousingUnitsQueryKey } from "@workspace/api-client-react";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: project, isLoading: projLoading } = useGetDeveloperProject(projectId, { query: { enabled: !!projectId, queryKey: getGetDeveloperProjectQueryKey(projectId) } });
  const { data: summary } = useGetDeveloperProjectSummary(projectId, { query: { enabled: !!projectId } });
  const { data: units, isLoading: unitsLoading } = useListHousingUnits(projectId, { query: { enabled: !!projectId, queryKey: getListHousingUnitsQueryKey(projectId) } });
  
  const [search, setSearch] = useState("");
  const [isUnitSheetOpen, setUnitSheetOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);

  if (projLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading...</div>;
  if (!project) return <div className="p-8 text-destructive font-bold">Project not found.</div>;

  const filtered = units?.filter(u => 
    u.unitNumber.toLowerCase().includes(search.toLowerCase()) || 
    (u.purchaserName && u.purchaserName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/developer-projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <span className="text-sm font-medium text-muted-foreground">Back to Projects</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20">
            <Home className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                ${project.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                  project.status === 'completed' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 
                  'bg-muted text-muted-foreground border-border'}
              `}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="font-mono uppercase text-primary font-semibold">{project.projectCode}</span>
              <span>•</span>
              <span className="font-medium">{project.developerName}</span>
            </div>
          </div>
        </div>
        <Button onClick={() => setEditOpen(true)} variant="outline">
          <Edit className="size-4 mr-2" /> Edit Project
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard label="Total Units" value={summary.totalUnits} />
          <StatCard label="Installed" value={summary.installed} color="text-blue-500" />
          <StatCard label="NEM Submitted" value={summary.nemSubmitted} color="text-amber-500" />
          <StatCard label="NEM Approved" value={summary.nemApproved} color="text-teal-500" />
          <StatCard label="Commissioned" value={summary.commissioned} color="text-primary" />
          <StatCard label="Handed Over" value={summary.handedOver} color="text-green-500" />
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-muted/20 px-4 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-lg">Housing Units Tracker</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center border border-border bg-background rounded-md px-3 py-1.5 w-full sm:w-64">
              <Search className="size-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                className="bg-transparent border-none outline-none flex-1 text-sm" 
                placeholder="Search unit or purchaser..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => setUnitSheetOpen(true)}>
              <Plus className="size-4 mr-2" /> Add Unit
            </Button>
          </div>
        </div>
        
        <div className="p-0">
          {unitsLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">Loading units...</div>
          ) : (!filtered || filtered.length === 0) ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Home className="size-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No units found</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground uppercase tracking-wider bg-muted/10 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Unit No.</th>
                    <th className="px-4 py-3 font-medium">Phase/Block</th>
                    <th className="px-4 py-3 font-medium">Purchaser</th>
                    <th className="px-4 py-3 font-medium">Capacity</th>
                    <th className="px-4 py-3 font-medium">Status Pipeline</th>
                    <th className="px-4 py-3 font-medium">NEM Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(unit => (
                    <tr key={unit.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold">{unit.unitNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {unit.phase ? `P${unit.phase}` : ''} {unit.block ? `B${unit.block}` : ''}
                        {!unit.phase && !unit.block && '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{unit.purchaserName || '-'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{unit.pvCapacityKwp ? `${unit.pvCapacityKwp} kWp` : '-'}</td>
                      <td className="px-4 py-3">
                        <PipelineStatus status={unit.unitStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {unit.nemApprovalDate ? (
                          <div className="text-xs font-bold text-teal-500">Approved</div>
                        ) : unit.nemApplicationDate ? (
                          <div className="text-xs font-medium text-amber-500">Submitted</div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Pending</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateUnitSheet projectId={projectId} open={isUnitSheetOpen} onClose={() => setUnitSheetOpen(false)} />
      <EditProjectSheet project={project} open={isEditOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function StatCard({ label, value, color = "text-foreground" }: { label: string, value: number, color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-center text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function PipelineStatus({ status }: { status: string }) {
  // Simplified pipeline view based on status progress
  const statuses = [
    'not_started', 'design_confirmed', 'equipment_allocated', 
    'installation_in_progress', 'installation_completed', 'testing_completed',
    'utility_submission_pending', 'utility_submission_submitted', 'utility_approval_received',
    'meter_installed', 'commissioned', 'handover_pending', 'handed_over', 'under_warranty', 'closed'
  ];
  const idx = statuses.indexOf(status);
  
  // Categorize into 4 main stages for visual simplicity
  const stages = [
    { label: "Prep", active: idx >= 1, current: idx >= 0 && idx < 3 },
    { label: "Install", active: idx >= 4, current: idx >= 3 && idx < 6 },
    { label: "Utility", active: idx >= 8, current: idx >= 6 && idx < 10 },
    { label: "Done", active: idx >= 12, current: idx >= 10 }
  ];

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, i) => (
        <div key={i} className="flex flex-col items-center gap-1 w-10">
          {stage.active ? (
             <CheckCircle2 className="size-4 text-teal-500" />
          ) : stage.current ? (
             <CircleDashed className="size-4 text-primary animate-pulse" />
          ) : (
             <div className="size-4 rounded-full border-2 border-muted" />
          )}
          <span className="text-[9px] uppercase font-semibold text-muted-foreground">{stage.label}</span>
        </div>
      ))}
      <div className="ml-2 pl-2 border-l border-border min-w-[100px] text-xs font-medium truncate capitalize">
        {status.replace(/_/g, ' ')}
      </div>
    </div>
  );
}

function CreateUnitSheet({ projectId, open, onClose }: { projectId: number, open: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const createUnit = useCreateHousingUnit({ projectId });
  const [formData, setFormData] = useState({
    unitNumber: "", block: "", phase: "", purchaserName: "", pvCapacityKwp: "", unitStatus: "not_started" as const
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUnit.mutate({ 
      data: { ...formData, pvCapacityKwp: formData.pvCapacityKwp ? Number(formData.pvCapacityKwp) : undefined } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHousingUnitsQueryKey(projectId) });
        onClose();
      }
    });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Add Housing Unit">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Unit Number <span className="text-red-500">*</span></label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phase</label>
            <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.phase} onChange={e => setFormData({...formData, phase: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Block</label>
            <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Purchaser Name</label>
          <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.purchaserName} onChange={e => setFormData({...formData, purchaserName: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">PV Capacity (kWp)</label>
          <input type="number" step="0.01" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.pvCapacityKwp} onChange={e => setFormData({...formData, pvCapacityKwp: e.target.value})} />
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createUnit.isPending}>Add Unit</Button>
        </div>
      </form>
    </SideSheet>
  );
}

function EditProjectSheet({ project, open, onClose }: { project: any, open: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const updateProject = useUpdateDeveloperProject({ projectId: project.id });
  const [formData, setFormData] = useState({
    projectName: project.projectName, projectCode: project.projectCode, developerName: project.developerName, 
    location: project.location || "", status: project.status
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDeveloperProjectQueryKey(project.id) });
        onClose();
      }
    });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Edit Project">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Name</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}
          >
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={updateProject.isPending}>Save Changes</Button>
        </div>
      </form>
    </SideSheet>
  );
}
