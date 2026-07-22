import React, { useState } from "react";
import { Link } from "wouter";
import { useListSites, useListCustomers, createSite, getListSitesQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

export default function Sites() {
  const { data: sites, isLoading } = useListSites();
  const { data: customers } = useListCustomers();
  const [search, setSearch] = useState("");
  const [isSheetOpen, setSheetOpen] = useState(false);

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
        <Button onClick={() => setSheetOpen(true)}>
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
            <Button onClick={() => setSheetOpen(true)} variant="outline" className="mt-4">Create Site</Button>
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
                      <Link href={`/sites/${site.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-medium text-primary">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateSiteSheet open={isSheetOpen} onClose={() => setSheetOpen(false)} customers={customers || []} />
    </div>
  );
}

function CreateSiteSheet({ open, onClose, customers }: { open: boolean; onClose: () => void; customers: any[] }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() });
      onClose();
    },
  });
  const [formData, setFormData] = useState({
    siteName: "", siteCode: "", address: "", siteType: "commercial" as const,
    status: "active" as const, customerId: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...formData, customerId: formData.customerId ? Number(formData.customerId) : undefined });
  };

  return (
    <SideSheet open={open} onClose={onClose} title="New Site">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer (Owner)</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}
          >
            <option value="">No customer linked</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
        <div className="pt-4 flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>Save Site</Button>
        </div>
      </form>
    </SideSheet>
  );
}
