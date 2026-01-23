"use client"

import { ChevronDown, ChevronUp, Brain } from "lucide-react";
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
    <div className="border rounded-md bg-muted/30 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Thinking Process</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-a:text-primary prose-blockquote:text-muted-foreground prose-code:text-foreground border-t pt-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {thinking}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
