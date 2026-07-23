import React, { useState } from "react";
import { Link } from "wouter";
import {
  useListSites, useListCustomers, createSite, updateSite, deleteSite,
  getListSitesQueryKey, ListSitesQueryResult, ListCustomersQueryResult,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

type Site = ListSitesQueryResult[number];
type Customer = ListCustomersQueryResult[number];

const BLANK_FORM = {
  siteName: "", siteCode: "", address: "",
  siteType: "commercial" as const,
  status: "active" as const,
  customerId: "",
};

export default function Sites() {
  const { data: sites, isLoading } = useListSites();
  const { data: customers } = useListCustomers();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() }),
  });

  const handleDelete = (s: Site) => {
    if (!window.confirm(`Delete site "${s.siteName}"? This cannot be undone.`)) return;
    deleteMutation.mutate(s.id);
  };

  const filtered = sites?.filter(s =>
    s.siteName.toLowerCase().includes(search.toLowerCase()) ||
    s.siteCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground text-sm mt-1">Physical locations of deployed solar assets.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-2" /> New Site
        </Button>
      </div>

      <div className="flex items-center border border-border bg-card rounded-md px-3 py-2 w-full max-w-sm">
        <Search className="size-4 text-muted-foreground mr-2" />
        <input
          type="text"
          className="bg-transparent border-none outline-none flex-1 text-sm"
          placeholder="Search sites by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading sites...</div>
        ) : (!filtered || filtered.length === 0) ? (
          <div className="p-12 text-center flex flex-col items-center">
            <MapPin className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No sites found</h3>
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4">Create Site</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Site</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((site) => (
                  <tr key={site.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/sites/${site.id}`}>{site.siteName}</Link>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{site.siteCode}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {site.siteType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                        ${site.status === 'active' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                          site.status === 'under_construction' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-muted text-muted-foreground border-border'}
                      `}>
                        {site.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-muted-foreground text-xs line-clamp-1 max-w-[200px]">{site.address}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/sites/${site.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs font-medium text-primary">View</Button>
                        </Link>
                        <Button
                          variant="ghost" size="sm"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground"
                          onClick={() => setEditing(site)}
                        >
                          <Pencil className="size-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(site)}
                          disabled={deleteMutation.isPending}
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

      <SiteSheet mode="create" open={createOpen} onClose={() => setCreateOpen(false)} customers={(customers as Customer[]) || []} />
      {editing && (
        <SiteSheet mode="edit" open={!!editing} onClose={() => setEditing(null)} customers={(customers as Customer[]) || []} site={editing} />
      )}
    </div>
  );
}

function SiteSheet(
  props:
    | { mode: "create"; open: boolean; onClose: () => void; customers: Customer[] }
    | { mode: "edit"; open: boolean; onClose: () => void; customers: Customer[]; site: Site }
) {
  const queryClient = useQueryClient();

  const initialForm = props.mode === "edit"
    ? {
        siteName: props.site.siteName,
        siteCode: props.site.siteCode,
        address: props.site.address,
        siteType: props.site.siteType as typeof BLANK_FORM["siteType"],
        status: props.site.status as typeof BLANK_FORM["status"],
        customerId: props.site.customerId ? String(props.site.customerId) : "",
      }
    : BLANK_FORM;

  const [formData, setFormData] = useState(initialForm);

  React.useEffect(() => {
    if (props.mode === "edit") {
      setFormData({
        siteName: props.site.siteName,
        siteCode: props.site.siteCode,
        address: props.site.address,
        siteType: props.site.siteType as typeof BLANK_FORM["siteType"],
        status: props.site.status as typeof BLANK_FORM["status"],
        customerId: props.site.customerId ? String(props.site.customerId) : "",
      });
    } else {
      setFormData(BLANK_FORM);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode === "edit" ? props.site.id : null]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = { ...data, customerId: data.customerId ? Number(data.customerId) : undefined };
      return props.mode === "create"
        ? createSite(payload)
        : updateSite((props as any).site.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() });
      props.onClose();
      if (props.mode === "create") setFormData(BLANK_FORM);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const title = props.mode === "create" ? "New Site" : `Edit — ${(props as any).site.siteName}`;
  const submitLabel = props.mode === "create"
    ? (mutation.isPending ? "Creating..." : "Save Site")
    : (mutation.isPending ? "Saving..." : "Save Changes");

  return (
    <SideSheet open={props.open} onClose={props.onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer (Owner)</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}
          >
            <option value="">No customer linked</option>
            {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Site Name</label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
              value={formData.siteName} onChange={e => setFormData({ ...formData, siteName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Site Code</label>
            <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono uppercase outline-none"
              value={formData.siteCode} onChange={e => setFormData({ ...formData, siteCode: e.target.value.toUpperCase() })} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Site Type</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.siteType} onChange={e => setFormData({ ...formData, siteType: e.target.value as any })}
          >
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
            <option value="utility_scale">Utility Scale</option>
            <option value="government">Government</option>
          </select>
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
        <div className="space-y-2">
          <label className="text-sm font-medium">Address</label>
          <textarea required className="w-full p-3 rounded-md border border-input bg-background text-sm min-h-[80px] outline-none"
            value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
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
