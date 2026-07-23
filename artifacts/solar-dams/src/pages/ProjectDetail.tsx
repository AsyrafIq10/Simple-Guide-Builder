import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetDeveloperProject, useGetDeveloperProjectSummary,
  useListHousingUnits, createHousingUnit, updateHousingUnit, deleteHousingUnit,
  updateDeveloperProject, deleteDeveloperProject,
  getGetDeveloperProjectQueryKey, getGetDeveloperProjectSummaryQueryKey,
  getListHousingUnitsQueryKey, getListDeveloperProjectsQueryKey,
  GetDeveloperProjectQueryResult, ListHousingUnitsQueryResult,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, ArrowLeft, Plus, Search, Pencil, Trash2, CheckCircle2, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

type Project = GetDeveloperProjectQueryResult;
type Unit = ListHousingUnitsQueryResult[number];

const UNIT_STATUSES = [
  'not_started', 'design_confirmed', 'equipment_allocated',
  'installation_in_progress', 'installation_completed', 'testing_completed',
  'utility_submission_pending', 'utility_submission_submitted', 'utility_approval_received',
  'meter_installed', 'commissioned', 'handover_pending', 'handed_over', 'under_warranty', 'closed',
] as const;

const BLANK_UNIT = {
  unitNumber: "", block: "", phase: "", purchaserName: "",
  pvCapacityKwp: "", unitStatus: "not_started" as const,
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const projectId = Number(id);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projLoading } = useGetDeveloperProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetDeveloperProjectQueryKey(projectId) },
  });
  const { data: summary } = useGetDeveloperProjectSummary(projectId, {
    query: { enabled: !!projectId, queryKey: getGetDeveloperProjectSummaryQueryKey(projectId) },
  });
  const { data: units, isLoading: unitsLoading } = useListHousingUnits(projectId, {
    query: { enabled: !!projectId, queryKey: getListHousingUnitsQueryKey(projectId) },
  });

  const [search, setSearch] = useState("");
  const [unitCreateOpen, setUnitCreateOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteDeveloperProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDeveloperProjectsQueryKey() });
      navigate("/developer-projects");
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: number) => deleteHousingUnit(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListHousingUnitsQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetDeveloperProjectSummaryQueryKey(projectId) });
    },
  });

  const handleDeleteProject = () => {
    if (!window.confirm(`Delete project "${project?.projectName}"? All housing units will also be removed. This cannot be undone.`)) return;
    deleteProjectMutation.mutate();
  };

  const handleDeleteUnit = (unit: Unit) => {
    if (!window.confirm(`Delete unit "${unit.unitNumber}"? This cannot be undone.`)) return;
    deleteUnitMutation.mutate(unit.id);
  };

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

      {/* Project header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20">
            <Home className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                ${project.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                  project.status === 'completed' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                  'bg-muted text-muted-foreground border-border'}
              `}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="font-mono uppercase text-primary font-semibold">{project.projectCode}</span>
              <span>•</span>
              <span className="font-medium">{project.developerName}</span>
              {project.location && <><span>•</span><span>{project.location}</span></>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setEditProjectOpen(true)} variant="outline" size="sm">
            <Pencil className="size-4 mr-2" /> Edit
          </Button>
          <Button
            onClick={handleDeleteProject}
            variant="outline" size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={deleteProjectMutation.isPending}
          >
            <Trash2 className="size-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Summary stats */}
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

      {/* Units tracker */}
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
            <Button size="sm" onClick={() => setUnitCreateOpen(true)}>
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
              <p className="text-sm text-muted-foreground mt-1 mb-4">Add housing units to start tracking the installation pipeline.</p>
              <Button size="sm" variant="outline" onClick={() => setUnitCreateOpen(true)}>
                <Plus className="size-4 mr-1" /> Add First Unit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground uppercase tracking-wider bg-muted/10 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Unit No.</th>
                    <th className="px-4 py-3 font-medium">Phase / Block</th>
                    <th className="px-4 py-3 font-medium">Purchaser</th>
                    <th className="px-4 py-3 font-medium">Capacity</th>
                    <th className="px-4 py-3 font-medium">Status Pipeline</th>
                    <th className="px-4 py-3 font-medium">NEM</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(unit => (
                    <tr key={unit.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold">{unit.unitNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {unit.phase ? `P${unit.phase}` : ''}{unit.block ? ` B${unit.block}` : ''}
                        {!unit.phase && !unit.block && '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{unit.purchaserName || '—'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{unit.pvCapacityKwp ? `${unit.pvCapacityKwp} kWp` : '—'}</td>
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                            onClick={() => setEditingUnit(unit)}
                          >
                            <Pencil className="size-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                            onClick={() => handleDeleteUnit(unit)}
                            disabled={deleteUnitMutation.isPending}
                          >
                            <Trash2 className="size-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <UnitSheet mode="create" projectId={projectId} open={unitCreateOpen} onClose={() => setUnitCreateOpen(false)} />
      {editingUnit && (
        <UnitSheet mode="edit" projectId={projectId} open={!!editingUnit} onClose={() => setEditingUnit(null)} unit={editingUnit} />
      )}
      <EditProjectSheet project={project} open={editProjectOpen} onClose={() => setEditProjectOpen(false)} />
    </div>
  );
}

function StatCard({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-center text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function PipelineStatus({ status }: { status: string }) {
  const idx = UNIT_STATUSES.indexOf(status as typeof UNIT_STATUSES[number]);
  const stages = [
    { label: "Prep",    active: idx >= 1,  current: idx >= 0  && idx < 3  },
    { label: "Install", active: idx >= 4,  current: idx >= 3  && idx < 6  },
    { label: "Utility", active: idx >= 8,  current: idx >= 6  && idx < 10 },
    { label: "Done",    active: idx >= 12, current: idx >= 10              },
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
      <div className="ml-2 pl-2 border-l border-border min-w-[90px] text-xs font-medium truncate capitalize">
        {status.replace(/_/g, ' ')}
      </div>
    </div>
  );
}

// ── Unit Sheet (create + edit) ───────────────────────────────────────────────

function UnitSheet(
  props:
    | { mode: "create"; projectId: number; open: boolean; onClose: () => void }
    | { mode: "edit";   projectId: number; open: boolean; onClose: () => void; unit: Unit }
) {
  const queryClient = useQueryClient();

  const initialForm = props.mode === "edit"
    ? {
        unitNumber:     props.unit.unitNumber,
        block:          props.unit.block || "",
        phase:          props.unit.phase || "",
        purchaserName:  props.unit.purchaserName || "",
        pvCapacityKwp:  props.unit.pvCapacityKwp ? String(props.unit.pvCapacityKwp) : "",
        unitStatus:     props.unit.unitStatus as typeof BLANK_UNIT["unitStatus"],
      }
    : BLANK_UNIT;

  const [formData, setFormData] = useState(initialForm);

  React.useEffect(() => {
    if (props.mode === "edit") {
      setFormData({
        unitNumber:     props.unit.unitNumber,
        block:          props.unit.block || "",
        phase:          props.unit.phase || "",
        purchaserName:  props.unit.purchaserName || "",
        pvCapacityKwp:  props.unit.pvCapacityKwp ? String(props.unit.pvCapacityKwp) : "",
        unitStatus:     props.unit.unitStatus as typeof BLANK_UNIT["unitStatus"],
      });
    } else {
      setFormData(BLANK_UNIT);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode === "edit" ? props.unit.id : null]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = { ...data, pvCapacityKwp: data.pvCapacityKwp ? Number(data.pvCapacityKwp) : undefined };
      return props.mode === "create"
        ? createHousingUnit(props.projectId, payload)
        : updateHousingUnit((props as any).unit.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListHousingUnitsQueryKey(props.projectId) });
      queryClient.invalidateQueries({ queryKey: getGetDeveloperProjectSummaryQueryKey(props.projectId) });
      props.onClose();
      if (props.mode === "create") setFormData(BLANK_UNIT);
    },
  });

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(formData); };

  const title = props.mode === "create" ? "Add Housing Unit" : `Edit Unit — ${(props as any).unit.unitNumber}`;
  const submitLabel = props.mode === "create"
    ? (mutation.isPending ? "Adding..." : "Add Unit")
    : (mutation.isPending ? "Saving..." : "Save Changes");

  return (
    <SideSheet open={props.open} onClose={props.onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Unit Number <span className="text-red-500">*</span></label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.unitNumber} onChange={e => setFormData({ ...formData, unitNumber: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phase</label>
            <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.phase} onChange={e => setFormData({ ...formData, phase: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Block</label>
            <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.block} onChange={e => setFormData({ ...formData, block: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Purchaser Name</label>
          <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.purchaserName} onChange={e => setFormData({ ...formData, purchaserName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">PV Capacity (kWp)</label>
          <input type="number" step="0.01" min="0" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.pvCapacityKwp} onChange={e => setFormData({ ...formData, pvCapacityKwp: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Pipeline Status</label>
          <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.unitStatus} onChange={e => setFormData({ ...formData, unitStatus: e.target.value as any })}
          >
            {UNIT_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        {mutation.error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2">
            {(mutation.error as Error).message || "Failed to save. Please try again."}
          </div>
        )}
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={props.onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{submitLabel}</Button>
        </div>
      </form>
    </SideSheet>
  );
}

// ── Edit Project Sheet ────────────────────────────────────────────────────────

function EditProjectSheet({ project, open, onClose }: { project: Project; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => updateDeveloperProject(project.id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(getGetDeveloperProjectQueryKey(project.id), updated);
      queryClient.invalidateQueries({ queryKey: getListDeveloperProjectsQueryKey() });
      onClose();
    },
  });
  const [formData, setFormData] = useState({
    projectName: project.projectName,
    projectCode: project.projectCode,
    developerName: project.developerName,
    location: project.location || "",
    totalUnits: project.totalUnits ? String(project.totalUnits) : "",
    status: project.status as "planning" | "in_progress" | "on_hold" | "completed",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...formData, totalUnits: formData.totalUnits ? Number(formData.totalUnits) : undefined });
  };

  return (
    <SideSheet open={open} onClose={onClose} title={`Edit — ${project.projectName}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Name</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Code</label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono outline-none"
              value={formData.projectCode} onChange={e => setFormData({ ...formData, projectCode: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Total Units</label>
            <input type="number" min="0" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.totalUnits} onChange={e => setFormData({ ...formData, totalUnits: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Developer Company</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.developerName} onChange={e => setFormData({ ...formData, developerName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {mutation.error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2">
            {(mutation.error as Error).message || "Failed to save. Please try again."}
          </div>
        )}
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </SideSheet>
  );
}
