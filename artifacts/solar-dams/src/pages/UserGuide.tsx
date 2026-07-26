import React, { useState, useEffect } from "react";
import { BookOpen, MapPin, Zap, HardHat, Home, Server, ChevronRight, Pencil, Trash2, Plus, Activity } from "lucide-react";

export default function UserGuide() {
  const [activeSection, setActiveSection] = useState("getting-started");

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 120) {
          current = section.getAttribute('id') || '';
        }
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) window.scrollTo({ top: element.offsetTop - 80, behavior: "smooth" });
  };

  const sections = [
    { id: "getting-started",  title: "Getting Started",          icon: BookOpen  },
    { id: "dashboard",        title: "Dashboard & KPIs",         icon: Server    },
    { id: "asset-registry",   title: "Asset Registry Workflow",  icon: Zap       },
    { id: "editing-deleting", title: "Editing & Deleting",       icon: Pencil    },
    { id: "equipment",        title: "Equipment Register",        icon: MapPin    },
    { id: "work-orders",      title: "Work Orders Lifecycle",     icon: HardHat   },
    { id: "live-monitoring",  title: "Live Monitoring",           icon: Activity  },
    { id: "developer-portal", title: "Housing Developer Portal",  icon: Home      },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 relative items-start animate-in fade-in duration-500">

      {/* Sticky Sidebar */}
      <div className="hidden md:block w-64 shrink-0 sticky top-24">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 px-2">Table of Contents</h3>
          <ul className="space-y-1">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  onClick={() => scrollTo(section.id)}
                  className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="size-4" />
                    <span>{section.title}</span>
                  </div>
                  {activeSection === section.id && <ChevronRight className="size-3" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm p-8 prose prose-slate dark:prose-invert max-w-none">

        <div className="mb-12 border-b border-border pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">User Guide</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to the GBJ SolarDAMS Operations Command Centre. This guide covers managing your solar portfolio, asset registries, maintenance workflows, live monitoring, and developer housing projects.
          </p>
        </div>

        {/* Getting Started */}
        <section id="getting-started" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <BookOpen className="size-6" /> Getting Started
          </h2>
          <p>
            GBJ SolarDAMS is a digital asset management system purpose-built for solar EPC and O&M operators in the Malaysian market. The platform is divided into four core pillars:
          </p>
          <ul className="space-y-4 my-6 list-none pl-0">
            <li className="bg-muted/30 p-4 rounded-lg border border-border">
              <strong>Asset Registry:</strong> The hierarchical database of Customers, Sites, PV Assets, and Component Equipment.
            </li>
            <li className="bg-muted/30 p-4 rounded-lg border border-border">
              <strong>Operations:</strong> The central dispatch for managing Work Orders, maintenance schedules, and fault resolutions.
            </li>
            <li className="bg-muted/30 p-4 rounded-lg border border-border">
              <strong>Live Monitoring:</strong> A real-time digital twin dashboard powered by Huawei FusionSolar — showing live power output, daily production curves, monthly and annual energy generation charts per asset.
            </li>
            <li className="bg-muted/30 p-4 rounded-lg border border-border">
              <strong>Housing Developer Portal:</strong> A specialised tracking pipeline for mass housing NEM implementations, tracking hundreds of units through installation and utility approvals.
            </li>
          </ul>
        </section>

        {/* Dashboard */}
        <section id="dashboard" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <Server className="size-6" /> Dashboard & KPIs
          </h2>
          <p>
            The dashboard is your operations command centre. It aggregates live data across your entire portfolio to surface urgent issues at a glance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold text-red-500 mb-2">Overdue Work Orders</h4>
              <p className="text-sm">Maintenance tasks that have passed their scheduled completion date. High priority for O&M managers.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold text-amber-500 mb-2">Expiring Warranties</h4>
              <p className="text-sm">Equipment warranties (inverters, modules) expiring within the next 90 days. Triggers end-of-warranty inspections.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2">Total PV Assets</h4>
              <p className="text-sm">Live count of all registered solar systems across every site in the portfolio.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2">Installed Capacity</h4>
              <p className="text-sm">Aggregate kWp of all operational and commissioned PV assets.</p>
            </div>
          </div>
        </section>

        {/* Asset Registry Workflow */}
        <section id="asset-registry" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <Zap className="size-6" /> Asset Registry Workflow
          </h2>
          <p>
            The asset registry enforces a strict hierarchy to ensure clean data management. When onboarding a new project, follow this exact sequence:
          </p>
          <div className="relative border-l-2 border-primary/30 ml-3 pl-6 space-y-8 my-8">
            <div className="relative">
              <div className="absolute -left-[35px] top-1 bg-primary text-white size-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-card">1</div>
              <h4 className="text-lg font-bold m-0 flex items-center gap-2">
                Create the Customer
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border ml-1">
                  <Plus className="size-3" /> New Customer
                </span>
              </h4>
              <p className="text-sm mt-2">Establish the commercial, residential, or industrial entity that owns the assets. Capture registration IDs and contact info. Navigate to <strong>Customers</strong> and click <em>New Customer</em>.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 bg-primary text-white size-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-card">2</div>
              <h4 className="text-lg font-bold m-0 flex items-center gap-2">
                Register the Site
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border ml-1">
                  <Plus className="size-3" /> New Site
                </span>
              </h4>
              <p className="text-sm mt-2">Link a physical location to the Customer. A customer can have multiple sites (e.g., a retail chain with solar on multiple branches). Navigate to <strong>Sites</strong> and click <em>New Site</em>.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 bg-primary text-white size-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-card">3</div>
              <h4 className="text-lg font-bold m-0 flex items-center gap-2">
                Register the PV Asset
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border ml-1">
                  <Plus className="size-3" /> Register Asset
                </span>
              </h4>
              <p className="text-sm mt-2">Register the actual solar system linked to the Site. Define system type (Grid-tied, NEM, Off-grid) and total capacity. Navigate to <strong>PV Assets</strong> and click <em>Register Asset</em>.</p>
            </div>
          </div>
        </section>

        {/* Editing & Deleting */}
        <section id="editing-deleting" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <Pencil className="size-6" /> Editing & Deleting Records
          </h2>
          <p>
            Every record in the Customers, Sites, PV Assets, and Work Orders lists has inline <strong>Edit</strong> and <strong>Delete</strong> actions directly in the table — no need to navigate into the detail page first.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="bg-card border border-border p-5 rounded-xl">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Pencil className="size-4 text-primary" /> Edit
              </h4>
              <p className="text-sm">
                Click the <strong>Edit</strong> button in the Actions column. A side panel opens pre-populated with the current values. Modify the fields you need and click <em>Save Changes</em>. The list refreshes automatically.
              </p>
            </div>
            <div className="bg-card border border-border p-5 rounded-xl">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Trash2 className="size-4 text-destructive" /> Delete
              </h4>
              <p className="text-sm">
                Click the <strong>Delete</strong> button in the Actions column. A confirmation prompt appears before any data is removed. Deletion is <strong>permanent</strong> — cascading records (e.g., assets under a site) are also removed.
              </p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex gap-3 text-red-800 dark:text-red-400">
            <Trash2 className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Cascade Warning:</strong> Deleting a <em>Customer</em> removes all their Sites. Deleting a <em>Site</em> removes all PV Assets at that site. Deleting a <em>PV Asset</em> removes all linked Equipment and Work Orders. Always confirm you no longer need the child records before deleting a parent.
            </div>
          </div>

          <p className="mt-6 text-sm">
            You can also edit any PV Asset record from its <strong>detail page</strong> (reached by clicking the asset name or the <em>View</em> button). The detail page provides additional context such as linked equipment, attachments, and the Live Monitoring tab.
          </p>
        </section>

        {/* Equipment Register */}
        <section id="equipment" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <MapPin className="size-6" /> Equipment Register
          </h2>
          <p>
            Once a PV Asset is created, populate its Equipment Register from the Asset detail page. This tracks serial numbers, capacities, and warranties of every major component in the system.
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li><strong>Inverters:</strong> Critical for warranty tracking and fault isolation.</li>
            <li><strong>PV Modules:</strong> Track exact models and batch serials.</li>
            <li><strong>Sensors & Meters:</strong> Necessary for monitoring integration.</li>
          </ul>
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-500">
            <HardHat className="size-5 shrink-0 mt-0.5" />
            <p className="text-sm m-0"><strong>Pro Tip:</strong> Accurate serial number entry during commissioning saves hours during warranty claims with manufacturers like Huawei or Sungrow.</p>
          </div>
        </section>

        {/* Work Orders */}
        <section id="work-orders" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <HardHat className="size-6" /> Work Orders Lifecycle
          </h2>
          <p>
            Work Orders (WO) drive all field operations. Every WO moves through a strict 11-status lifecycle to ensure accountability and cost tracking.
          </p>
          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm text-left border border-border">
              <thead className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 border-b border-border w-1/4">Status Stage</th>
                  <th className="px-4 py-3 border-b border-border">Definition & Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-3 font-bold text-gray-500">Draft / Open</td><td className="px-4 py-3">Issue logged, awaiting assignment by O&M Coordinator.</td></tr>
                <tr><td className="px-4 py-3 font-bold text-blue-500">Assigned / Scheduled</td><td className="px-4 py-3">Allocated to a technician and date confirmed.</td></tr>
                <tr><td className="px-4 py-3 font-bold text-amber-500">In Progress</td><td className="px-4 py-3">Technician currently on-site executing the work.</td></tr>
                <tr><td className="px-4 py-3 font-bold text-red-500">Awaiting Parts/Approval</td><td className="px-4 py-3">Work halted. Requires management sign-off or spare parts delivery.</td></tr>
                <tr><td className="px-4 py-3 font-bold text-teal-500">Completed</td><td className="px-4 py-3">Field work done. Pending management verification.</td></tr>
                <tr><td className="px-4 py-3 font-bold text-primary">Verified / Closed</td><td className="px-4 py-3">Work confirmed satisfactory. Costs finalised and archived.</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-bold mt-8 mb-4">Editing & Deleting Work Orders</h3>
          <p className="text-sm mb-4">
            Every row in the Work Orders table has inline <strong>Edit</strong> and <strong>Delete</strong> buttons in the Actions column on the right.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2"><Pencil className="size-4 text-primary" /> Edit Work Order</h4>
              <p className="text-sm">Opens a pre-populated side panel. You can update the <strong>description, type, priority, status, assignee, scheduled date, labour cost, material cost,</strong> and <strong>resolution notes</strong>. The asset cannot be changed after creation. Click <em>Save Changes</em> to apply.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2"><Trash2 className="size-4 text-destructive" /> Delete Work Order</h4>
              <p className="text-sm">Permanently removes the work order after a confirmation prompt. Use this to clear test records or cancelled jobs that should not appear in history.</p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 text-blue-800 dark:text-blue-400">
            <Activity className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Cost Tracking:</strong> Use the Edit panel to record <strong>Labour Cost</strong> and <strong>Material Cost</strong> (in RM) once the work is complete. These values feed into future cost reporting and are stored against each work order permanently.
            </div>
          </div>
        </section>

        {/* Live Monitoring */}
        <section id="live-monitoring" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <Activity className="size-6" /> Live Monitoring (Digital Twin)
          </h2>
          <p>
            Each PV Asset can be linked to Huawei FusionSolar to enable real-time performance monitoring. Open any asset's detail page and switch to the <strong>⚡ Live Monitoring</strong> tab.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold text-blue-500 mb-2">Real-time KPIs</h4>
              <p className="text-sm">Live power output (kW), today's energy yield (kWh), performance ratio (%), and current inverter status refreshed every minute.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold text-teal-500 mb-2">Daily Power Curve</h4>
              <p className="text-sm">A 30-day rolling area chart showing daily energy production (kWh/day), useful for spotting underperforming days or soiling events.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold text-purple-500 mb-2">Monthly Generation</h4>
              <p className="text-sm">Bar chart of monthly kWh production for the current calendar year, enabling seasonal performance comparison.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold text-amber-500 mb-2">Annual Summary</h4>
              <p className="text-sm">Multi-year annual generation chart for long-term trend analysis and degradation monitoring.</p>
            </div>
          </div>

          <h3 className="text-lg font-bold mt-8 mb-3">Linking an Asset to FusionSolar</h3>
          <div className="relative border-l-2 border-primary/30 ml-3 pl-6 space-y-6 my-6">
            <div className="relative">
              <div className="absolute -left-[35px] top-1 bg-primary text-white size-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-card">1</div>
              <h4 className="text-base font-bold m-0">Get your FusionSolar Station Code</h4>
              <p className="text-sm mt-1">Log in to the FusionSolar portal. Navigate to <em>Plant Management</em> → select your plant → copy the <strong>Station Code</strong> from the plant details page.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 bg-primary text-white size-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-card">2</div>
              <h4 className="text-base font-bold m-0">Enter the code in SolarDAMS</h4>
              <p className="text-sm mt-1">Open the PV Asset's detail page → click <strong>Edit Asset</strong> → scroll to the <em>FusionSolar Station Code</em> field → paste the code → click <em>Save Changes</em>.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[35px] top-1 bg-primary text-white size-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-card">3</div>
              <h4 className="text-base font-bold m-0">Switch to Live Monitoring tab</h4>
              <p className="text-sm mt-1">The <strong>⚡ Live Monitoring</strong> tab will now fetch live data from FusionSolar and display all four KPI cards and charts automatically.</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-500 mt-4">
            <HardHat className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Administrator Note:</strong> FusionSolar API credentials (<em>Username</em> and <em>System Code</em>) must be configured in the server's Secrets panel before the Live Monitoring tab becomes active. Contact your system administrator if the tab shows a "not configured" message.
            </div>
          </div>
        </section>

        {/* Developer Portal */}
        <section id="developer-portal" className="mb-8 scroll-mt-24">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-border pb-2 mb-6 text-primary">
            <Home className="size-6" /> Housing Developer Portal
          </h2>
          <p>
            Managing solar installations for mass housing projects (e.g., 200+ units in a new phase) requires tracking at the unit level. The Developer Portal provides a specialised view for this workflow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="bg-card border border-border p-5 rounded-xl">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><MapPin className="size-4 text-primary" /> Tracking Pipeline</h4>
              <p className="text-sm">Each housing unit moves through a 15-stage pipeline from "Not Started" through installation and testing to "Utility Approval" (NEM), and finally "Handed Over".</p>
            </div>
            <div className="bg-card border border-border p-5 rounded-xl">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Zap className="size-4 text-primary" /> NEM Management</h4>
              <p className="text-sm">The pipeline explicitly tracks Net Energy Metering (NEM) submissions to TNB/SEB. A unit cannot be commissioned until NEM approval is secured.</p>
            </div>
          </div>

          <h3 className="text-lg font-bold mt-8 mb-4">Managing Projects</h3>
          <p className="text-sm mb-4">
            Each project card on the Projects list has an <strong>Edit</strong> and <strong>Delete</strong> action at the bottom of the card. You can also Edit or Delete a project from inside its detail page using the buttons in the project header.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2"><Pencil className="size-4 text-primary" /> Edit Project</h4>
              <p className="text-sm">Update the project name, code, developer company, location, total unit count, and overall status. The summary stats recalculate automatically from actual unit pipeline data.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2"><Trash2 className="size-4 text-destructive" /> Delete Project</h4>
              <p className="text-sm">Permanently removes the project and <strong>all housing units</strong> beneath it. A confirmation prompt is shown before deletion. Use with care — this cannot be reversed.</p>
            </div>
          </div>

          <h3 className="text-lg font-bold mt-8 mb-4">Managing Housing Units</h3>
          <p className="text-sm mb-4">
            Inside a project's detail page, every row in the <strong>Housing Units Tracker</strong> table has inline <strong>Edit</strong> and <strong>Delete</strong> buttons in the Actions column.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2"><Pencil className="size-4 text-primary" /> Edit Unit</h4>
              <p className="text-sm">Update any unit field — unit number, phase, block, purchaser name, PV capacity, or <strong>Pipeline Status</strong>. Changing the pipeline status is the primary way to advance a unit through installation stages. The project summary counters (Installed, NEM Approved, etc.) update immediately.</p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2"><Trash2 className="size-4 text-destructive" /> Delete Unit</h4>
              <p className="text-sm">Removes a single housing unit from the tracker. A confirmation prompt is shown first. The project summary counters refresh automatically after deletion.</p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 text-blue-800 dark:text-blue-400">
            <Zap className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Pipeline Status tip:</strong> The 15-stage pipeline is the backbone of the Developer Portal. Use the Edit Unit sheet to advance a unit's status as work progresses on-site. The four pipeline indicator icons (Prep → Install → Utility → Done) in each row give a quick visual summary of where each unit stands.
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
