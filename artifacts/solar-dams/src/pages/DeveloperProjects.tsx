import React, { useState } from "react";
import { Link } from "wouter";
import {
  useListDeveloperProjects,
  createDeveloperProject, updateDeveloperProject, deleteDeveloperProject,
  getListDeveloperProjectsQueryKey,
  ListDeveloperProjectsQueryResult,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Plus, Search, MapPin, BarChart3, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

type Project = ListDeveloperProjectsQueryResult[number];

const BLANK_FORM = {
  projectName: "", projectCode: "", developerName: "",
  location: "", totalUnits: "", status: "planning" as const,
};

export default function DeveloperProjects() {
  const { data: projects, isLoading } = useListDeveloperProjects();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDeveloperProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDeveloperProjectsQueryKey() }),
  });

  const handleDelete = (p: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete project "${p.projectName}"? All housing units will also be removed. This cannot be undone.`)) return;
    deleteMutation.mutate(p.id);
  };

  const handleEdit = (p: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(p);
  };

  const filtered = projects?.filter(p =>
    p.projectName.toLowerCase().includes(search.toLowerCase()) ||
    p.developerName.toLowerCase().includes(search.toLowerCase()) ||
    p.projectCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Mass housing development NEM solar portfolios.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="flex items-center border border-border bg-card rounded-md px-3 py-2 w-full max-w-sm">
        <Search className="size-4 text-muted-foreground mr-2" />
        <input
          type="text"
          className="bg-transparent border-none outline-none flex-1 text-sm"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground animate-pulse">Loading developer projects...</div>
      ) : (!filtered || filtered.length === 0) ? (
        <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center flex flex-col items-center">
          <Home className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No projects found</h3>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4">Create Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => (
            <div key={project.id} className="bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full group relative">
              {/* Card body — clickable to navigate */}
              <Link href={`/developer-projects/${project.id}`} className="flex flex-col flex-1 p-5 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate">{project.projectName}</h3>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{project.projectCode}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0
                    ${project.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                      project.status === 'completed' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                      'bg-muted text-muted-foreground border-border'}
                  `}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-3 mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{project.developerName}</span>
                  </div>
                  {project.location && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{project.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="size-4 text-primary shrink-0" />
                    <span className="font-bold">{project.totalUnits || 0} <span className="text-muted-foreground font-normal">units total</span></span>
                  </div>
                </div>
              </Link>

              {/* Action strip at the bottom */}
              <div className="px-4 py-2 border-t border-border flex justify-end gap-1 bg-muted/10 rounded-b-xl">
                <Button
                  variant="ghost" size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                  onClick={(e) => handleEdit(project, e)}
                >
                  <Pencil className="size-3.5 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                  onClick={(e) => handleDelete(project, e)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectSheet mode="create" open={createOpen} onClose={() => setCreateOpen(false)} />
      {editing && (
        <ProjectSheet mode="edit" open={!!editing} onClose={() => setEditing(null)} project={editing} />
      )}
    </div>
  );
}

function ProjectSheet(
  props:
    | { mode: "create"; open: boolean; onClose: () => void }
    | { mode: "edit"; open: boolean; onClose: () => void; project: Project }
) {
  const queryClient = useQueryClient();

  const initialForm = props.mode === "edit"
    ? {
        projectName: props.project.projectName,
        projectCode: props.project.projectCode,
        developerName: props.project.developerName,
        location: props.project.location || "",
        totalUnits: props.project.totalUnits ? String(props.project.totalUnits) : "",
        status: props.project.status as typeof BLANK_FORM["status"],
      }
    : BLANK_FORM;

  const [formData, setFormData] = useState(initialForm);

  React.useEffect(() => {
    if (props.mode === "edit") {
      setFormData({
        projectName: props.project.projectName,
        projectCode: props.project.projectCode,
        developerName: props.project.developerName,
        location: props.project.location || "",
        totalUnits: props.project.totalUnits ? String(props.project.totalUnits) : "",
        status: props.project.status as typeof BLANK_FORM["status"],
      });
    } else {
      setFormData(BLANK_FORM);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode === "edit" ? props.project.id : null]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = { ...data, totalUnits: data.totalUnits ? Number(data.totalUnits) : undefined };
      return props.mode === "create"
        ? createDeveloperProject(payload)
        : updateDeveloperProject((props as any).project.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDeveloperProjectsQueryKey() });
      props.onClose();
      if (props.mode === "create") setFormData(BLANK_FORM);
    },
  });

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(formData); };

  const title = props.mode === "create" ? "New Developer Project" : `Edit — ${(props as any).project.projectName}`;
  const submitLabel = props.mode === "create"
    ? (mutation.isPending ? "Creating..." : "Create Project")
    : (mutation.isPending ? "Saving..." : "Save Changes");

  return (
    <SideSheet open={props.open} onClose={props.onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.projectName} onChange={e => setFormData({ ...formData, projectName: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Code <span className="text-red-500">*</span></label>
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
          <label className="text-sm font-medium">Developer Company <span className="text-red-500">*</span></label>
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
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={props.onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{submitLabel}</Button>
        </div>
      </form>
    </SideSheet>
  );
}
