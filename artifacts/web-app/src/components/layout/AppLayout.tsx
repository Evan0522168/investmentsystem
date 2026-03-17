import React from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Activity, 
  Bell, 
  Search, 
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: Activity, label: "Activity", href: "/activity" },
    { icon: Users, label: "Team", href: "/team" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg">Nexus</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen w-64 border-r border-border/40 bg-sidebar/50 backdrop-blur-xl flex-col z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-3 hidden md:flex">
          <div className="w-8 h-8 rounded-lg bg-primary shadow-sm flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight">Nexus</span>
        </div>

        <div className="px-4 py-2">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-primary/5 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className={cn(
                    "w-4 h-4 transition-colors", 
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
            <img 
              src={`${import.meta.env.BASE_URL}images/avatar.png`} 
              alt="User" 
              className="w-9 h-9 rounded-full border border-border shadow-sm object-cover bg-background"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Alex Rivera</p>
              <p className="text-xs text-muted-foreground truncate">alex@nexus.inc</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background ambient effect */}
        <div className="absolute top-0 right-0 w-full h-[500px] opacity-[0.03] pointer-events-none -z-10"
             style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/abstract-bg.png)`, backgroundSize: 'cover', backgroundPosition: 'top right' }} 
        />
        
        <header className="sticky top-0 z-30 flex items-center justify-end px-6 py-4 bg-background/60 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
            </button>
            <div className="w-px h-6 bg-border/60" />
            <button className="text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:shadow hover:opacity-90 transition-all active:scale-95">
              Create Report
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
