import React from "react";
import { motion } from "framer-motion";
import { useSystemHealth } from "@/hooks/use-api";
import { 
  ArrowUpRight, 
  Users, 
  CreditCard, 
  Activity, 
  CheckCircle2, 
  ServerCrash, 
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

const FADE_UP_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 150 } },
};

export default function Home() {
  const { status, isHealthy, isLoading, refetch } = useSystemHealth();

  const metrics = [
    { label: "Total Revenue", value: "$45,231.89", change: "+20.1%", trend: "up", icon: CreditCard },
    { label: "Active Subscriptions", value: "2,350", change: "+180", trend: "up", icon: Users },
    { label: "Active Sessions", value: "12,234", change: "+19%", trend: "up", icon: Activity },
  ];

  const recentActivity = [
    { id: 1, user: "Sarah Jenkins", action: "upgraded to Pro Plan", time: "2 hours ago", initial: "SJ" },
    { id: 2, user: "Michael Chen", action: "invited 3 new team members", time: "4 hours ago", initial: "MC" },
    { id: 3, user: "Emma Watson", action: "downloaded Q3 Report", time: "5 hours ago", initial: "EW" },
    { id: 4, user: "David Kim", action: "canceled subscription", time: "Yesterday", initial: "DK" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-8"
    >
      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
            Welcome back, Alex
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Here's what's happening with your projects today.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border/50 shadow-sm rounded-xl py-2 px-4">
          <div className="flex items-center gap-2 border-r border-border/50 pr-4">
            {isLoading ? (
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
            ) : isHealthy ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <ServerCrash className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm font-medium text-foreground">
              API: <span className="text-muted-foreground capitalize">{status}</span>
            </span>
          </div>
          <button 
            onClick={() => refetch()} 
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Status"
          >
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, i) => (
          <div 
            key={i} 
            className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md hover:border-border transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-primary/5 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                <metric.icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                {metric.change}
              </div>
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">{metric.label}</h3>
              <p className="text-3xl font-display font-semibold text-foreground mt-1 tracking-tight">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area Placeholder */}
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="lg:col-span-2 bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-semibold text-foreground text-lg">Revenue Overview</h3>
              <p className="text-sm text-muted-foreground">Monthly performance metrics</p>
            </div>
            <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-[300px] flex items-end gap-2 pt-4">
            {/* Minimalist decorative bar chart */}
            {[40, 70, 45, 90, 65, 85, 100, 50, 75, 60, 80, 95].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col justify-end group">
                <div 
                  className="w-full bg-primary/10 rounded-t-sm group-hover:bg-primary/20 transition-colors relative"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ${(height * 120).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 border-t border-border/50 pt-4 text-xs font-medium text-muted-foreground">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground text-lg">Recent Activity</h3>
            <button className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {recentActivity.map((activity, idx) => (
              <div key={activity.id} className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground border border-border/50 shrink-0">
                  {activity.initial}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-foreground">
                    <span className="font-medium group-hover:text-primary transition-colors cursor-pointer">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-8 py-2.5 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors">
            View All Activity
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
