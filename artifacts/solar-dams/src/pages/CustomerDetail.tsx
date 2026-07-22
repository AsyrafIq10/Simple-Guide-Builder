import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetCustomer, useListSites, updateCustomer, getGetCustomerQueryKey, getListSitesQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, User, Mail, Phone, MapPin, Edit, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

export default function CustomerDetail() {
  const { id } = useParams();
  const customerId = Number(id);
  const { data: customer, isLoading } = useGetCustomer(customerId, { query: { enabled: !!customerId, queryKey: getGetCustomerQueryKey(customerId) } });
  const { data: sites } = useListSites({ query: { queryKey: getListSitesQueryKey() } });
  const [isEditOpen, setEditOpen] = useState(false);

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading...</div>;
  if (!customer) return <div className="p-8 text-destructive font-bold">Customer not found.</div>;

  const linkedSites = sites?.filter(s => s.customerId === customerId) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/customers">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <span className="text-sm font-medium text-muted-foreground">Back to Customers</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            {customer.customerType === 'residential' ? <User className="size-8" /> : <Building2 className="size-8" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="uppercase tracking-wider font-semibold text-xs text-primary">{customer.customerType}</span>
              <span>•</span>
              <span>{customer.identityOrRegistrationNumber || 'No ID'}</span>
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
            <div className="bg-muted/20 px-4 py-3 border-b border-border font-semibold text-sm">Contact Information</div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-muted-foreground">{customer.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Phone</div>
                  <div className="text-muted-foreground">{customer.phone || 'Not provided'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Billing Address</div>
                  <div className="text-muted-foreground">{customer.billingAddress || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Linked Sites</h3>
            <Link href="/sites">
              <Button size="sm" variant="outline"><Plus className="size-3 mr-2" /> Link Site</Button>
            </Link>
          </div>

          {linkedSites.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
              <MapPin className="size-8 mx-auto mb-3 opacity-20" />
              <p>No sites linked to this customer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {linkedSites.map(site => (
                <Link key={site.id} href={`/sites/${site.id}`}>
                  <div className="bg-card border border-border hover:border-primary/50 transition-colors rounded-xl p-4 shadow-sm cursor-pointer group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold group-hover:text-primary transition-colors">{site.siteName}</h4>
                        <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold">{site.siteCode}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm
                        ${site.status === 'active' ? 'bg-teal-500/10 text-teal-600' : 'bg-muted text-muted-foreground'}
                      `}>
                        {site.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{site.address}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditCustomerSheet customer={customer} open={isEditOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function EditCustomerSheet({ customer, open, onClose }: { customer: any; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => updateCustomer(customer.id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(getGetCustomerQueryKey(customer.id), updated);
      onClose();
    },
  });
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email,
    phone: customer.phone || "",
    customerType: customer.customerType,
    identityOrRegistrationNumber: customer.identityOrRegistrationNumber || "",
    billingAddress: customer.billingAddress || "",
    serviceAddress: customer.serviceAddress || "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Edit Customer">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input required type="email" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Billing Address</label>
          <textarea className="w-full p-3 rounded-md border border-input bg-background text-sm outline-none min-h-[80px]"
            value={formData.billingAddress} onChange={e => setFormData({ ...formData, billingAddress: e.target.value })} />
        </div>
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
