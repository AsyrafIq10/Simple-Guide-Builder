import React from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Sites from "./pages/Sites";
import SiteDetail from "./pages/SiteDetail";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import WorkOrders from "./pages/WorkOrders";
import DeveloperProjects from "./pages/DeveloperProjects";
import ProjectDetail from "./pages/ProjectDetail";
import UserGuide from "./pages/UserGuide";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/login" component={Login} />
        
        <Route path="/customers" component={Customers} />
        <Route path="/customers/:id" component={CustomerDetail} />
        
        <Route path="/sites" component={Sites} />
        <Route path="/sites/:id" component={SiteDetail} />
        
        <Route path="/assets" component={Assets} />
        <Route path="/assets/:id" component={AssetDetail} />
        
        <Route path="/work-orders" component={WorkOrders} />
        
        <Route path="/developer-projects" component={DeveloperProjects} />
        <Route path="/developer-projects/:id" component={ProjectDetail} />
        
        <Route path="/user-guide" component={UserGuide} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
