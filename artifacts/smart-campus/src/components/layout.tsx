import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  CreditCard,
  LineChart,
  LogOut,
  Bell
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/students", label: "Directory", icon: Users },
    { href: "/courses", label: "Curriculum", icon: BookOpen },
    { href: "/enrollments", label: "Registrations", icon: GraduationCap },
    { href: "/fees", label: "Financials", icon: CreditCard },
    { href: "/performance", label: "Academics", icon: LineChart },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col md:sticky top-0 md:h-screen shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono">
              SC
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight leading-none">Smart Campus</span>
              <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest mt-1">Admin Portal</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2">Navigation</div>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8 rounded-md border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-xs rounded-md">AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Administrator</span>
              <span className="text-xs text-sidebar-foreground/60">System Access</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight">
              {navItems.find(i => location === i.href || (i.href !== "/" && location.startsWith(i.href)))?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute 0 right-0 w-2 h-2 rounded-full bg-primary ring-2 ring-card"></span>
            </button>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Link>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
