"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1 px-2 py-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-typing-dot"
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: "1.4s"
          }}
        />
      ))}
    </div>
  );
}
