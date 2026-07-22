import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, MapPin, Zap, HardHat, FileText, Home, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { group: "Overview" },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { group: "Asset Registry" },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Sites", href: "/sites", icon: MapPin },
  { name: "PV Assets", href: "/assets", icon: Zap },
  { group: "Operations" },
  { name: "Work Orders", href: "/work-orders", icon: HardHat },
  { group: "Housing Developer" },
  { name: "Projects", href: "/developer-projects", icon: Home },
  { group: "Help" },
  { name: "User Guide", href: "/user-guide", icon: FileText },
];

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (o: boolean) => void }) {
  const [location] = useLocation();

  const isCurrent = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-primary flex items-center justify-center shadow-inner">
            <Zap className="text-white size-5" />
          </div>
          <span className="font-bold text-lg tracking-tight tracking-wider text-white">GBJ SolarDAMS</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item, idx) => {
          if (item.group) {
            return (
              <div key={idx} className="pt-6 pb-2 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                {item.group}
              </div>
            );
          }
          const active = isCurrent(item.href!);
          const Icon = item.icon!;
          return (
            <Link key={item.name} href={item.href!}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
                  active 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="size-4" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/40 text-center">
        Phase 1 Preview
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 shadow-xl">
        <SidebarContent />
      </div>
      
      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-64 flex-col bg-sidebar">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setMobileOpen(false)}>
                <X className="size-6" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [location] = useLocation();

  if (location === "/login") {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <div className="h-16 border-b border-border bg-card flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="font-semibold text-sm text-muted-foreground tracking-wide uppercase">
              Operations Command Centre
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              JS
            </div>
          </div>
        </div>
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
