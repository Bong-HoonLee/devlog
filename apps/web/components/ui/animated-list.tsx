"use client";

import { motion } from "framer-motion";

interface AnimatedListProps {
  children: React.ReactNode[];
}

export function AnimatedList({ children }: AnimatedListProps) {
  return (
    <div className="space-y-6">
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
