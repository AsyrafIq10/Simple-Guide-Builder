import React from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 size-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 size-[500px] bg-accent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl z-10 p-8">
        <div className="flex justify-center mb-8">
          <div className="size-16 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Zap className="text-white size-8" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">GBJ SolarDAMS</h1>
          <p className="text-muted-foreground text-sm">Operations Command Centre</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input 
              type="email" 
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="operator@gbjsolar.com"
              value="demo@gbjsolar.com"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex justify-between">
              Password
              <span className="text-primary hover:underline cursor-pointer">Forgot?</span>
            </label>
            <input 
              type="password" 
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value="••••••••"
              readOnly
            />
          </div>
          <div className="pt-4">
            <Link href="/">
              <Button className="w-full text-base font-bold h-12" size="lg">
                Enter Command Centre
              </Button>
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Phase 1 Preview Mode
          </p>
        </div>
      </div>
    </div>
  );
}
