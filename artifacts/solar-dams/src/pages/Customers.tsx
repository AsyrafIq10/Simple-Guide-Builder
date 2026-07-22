import React, { useState } from "react";
import { Link } from "wouter";
import { useListCustomers, createCustomer, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet } from "@/components/ui/side-sheet";

export default function Customers() {
  const { data: customers, isLoading } = useListCustomers();
  const [search, setSearch] = useState("");
  const [isSheetOpen, setSheetOpen] = useState(false);

  const filtered = customers?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.customerType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage asset owners and portfolio clients.</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-2" /> New Customer
        </Button>
      </div>

      <div className="flex items-center border border-border bg-card rounded-md px-3 py-2 w-full max-w-sm">
        <Search className="size-4 text-muted-foreground mr-2" />
        <input
          type="text"
          className="bg-transparent border-none outline-none flex-1 text-sm"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading customers...</div>
        ) : (!filtered || filtered.length === 0) ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No customers found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Get started by creating your first client.</p>
            <Button onClick={() => setSheetOpen(true)} variant="outline">Create Customer</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        <Link href={`/customers/${customer.id}`}>{customer.name}</Link>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{customer.identityOrRegistrationNumber || 'No ID/Reg provided'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                        {customer.customerType === 'residential' ? <User className="size-3 mr-1" /> : <Building2 className="size-3 mr-1" />}
                        <span className="capitalize">{customer.customerType}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{customer.email}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">{customer.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/customers/${customer.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-medium text-primary">View details</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateCustomerSheet open={isSheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

function CreateCustomerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof createCustomer>[0]) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      onClose();
      setFormData({ name: "", email: "", phone: "", customerType: "commercial", identityOrRegistrationNumber: "", billingAddress: "", serviceAddress: "" });
    },
  });
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", customerType: "commercial" as const,
    identityOrRegistrationNumber: "", billingAddress: "", serviceAddress: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <SideSheet open={open} onClose={onClose} title="New Customer">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Type</label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.customerType}
            onChange={e => setFormData({ ...formData, customerType: e.target.value as any })}
          >
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
            <option value="government">Government</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input required type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Registration / IC No.</label>
          <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none"
            value={formData.identityOrRegistrationNumber} onChange={e => setFormData({ ...formData, identityOrRegistrationNumber: e.target.value })} />
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
            {mutation.isPending ? "Creating..." : "Save Customer"}
          </Button>
        </div>
      </form>
    </SideSheet>
  );
}
