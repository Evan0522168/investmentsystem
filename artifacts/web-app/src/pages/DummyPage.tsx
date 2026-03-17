import React from "react";
import { motion } from "framer-motion";
import { FileX } from "lucide-react";

export default function DummyPage({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 border border-border/50 shadow-sm">
        <FileX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
        {title} Overview
      </h2>
      <p className="text-muted-foreground max-w-sm">
        This section is currently under development. Check back later for updates on your {title.toLowerCase()} metrics.
      </p>
    </motion.div>
  );
}
