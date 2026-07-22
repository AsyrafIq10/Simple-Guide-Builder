import React, { useState } from "react";
import { Link } from "wouter";
import { useListDeveloperProjects, createDeveloperProject, getListDeveloperProjectsQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Plus, Search, MapPin, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

export default function DeveloperProjects() {
  const { data: projects, isLoading } = useListDeveloperProjects();
  const [search, setSearch] = useState("");
  const [isSheetOpen, setSheetOpen] = useState(false);

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
        <Button onClick={() => setSheetOpen(true)}>
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
          <Button onClick={() => setSheetOpen(true)} variant="outline" className="mt-4">Create Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => (
            <Link key={project.id} href={`/developer-projects/${project.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{project.projectName}</h3>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{project.projectCode}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap
                    ${project.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                      project.status === 'completed' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                      'bg-muted text-muted-foreground border-border'}
                  `}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3 mt-auto pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="size-4 text-muted-foreground" />
                    <span className="font-medium">{project.developerName}</span>
                  </div>
                  {project.location && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{project.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="size-4 text-primary" />
                    <span className="font-bold">{project.totalUnits || 0} <span className="text-muted-foreground font-normal">units total</span></span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectSheet open={isSheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

function CreateProjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => createDeveloperProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDeveloperProjectsQueryKey() });
      onClose();
    },
  });
  const [formData, setFormData] = useState({
    projectName: "", projectCode: "", developerName: "",
    location: "", totalUnits: "", status: "planning" as const,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...formData, totalUnits: formData.totalUnits ? Number(formData.totalUnits) : undefined });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="New Developer Project">
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
            <input type="number" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
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
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>Create Project</Button>
        </div>
      </form>
    </SideSheet>
  );
}
