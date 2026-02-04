"use client"

import { ChevronDown, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ThinkingSectionProps {
  thinking: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ThinkingSection({ thinking, isExpanded, onToggle }: ThinkingSectionProps) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <BrainCircuit className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Thinking</span>
        </div>
        <div className={cn(
          "flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 transition-transform duration-200",
          isExpanded && "rotate-180"
        )}>
          <ChevronDown className="h-3 w-3 text-slate-600 dark:text-slate-400" />
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-200 dark:border-slate-800">
          <div className="pt-2 text-sm prose prose-sm dark:prose-invert max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-a:text-violet-600 dark:prose-a:text-violet-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {thinking}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
