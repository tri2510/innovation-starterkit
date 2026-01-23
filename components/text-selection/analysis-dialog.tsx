"use client"

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { ThinkingSection } from "./thinking-section";
import { useTextAnalysis } from "@/hooks/use-text-analysis";
import { cn } from "@/lib/utils";
import { CrackItIcon } from "./crack-it-icon";

interface AnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  analysisId: string;
}

export function AnalysisDialog({ isOpen, onClose, selectedText, analysisId }: AnalysisDialogProps) {
  const { state, analyze, reset } = useTextAnalysis();
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && selectedText) {
      setIsThinkingExpanded(false);
      analyze(selectedText);
    }
    return () => {
      if (!isOpen) {
        reset();
      }
    };
  }, [isOpen, selectedText, analysisId, analyze, reset]);

  const handleCopy = () => {
    const fullText = state.thinking + "\n\n" + state.content;
    navigator.clipboard.writeText(fullText);
  };

  const hasSources = state.sources.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CrackItIcon size={20} />
            Crack It
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            Analyzing: "{selectedText.slice(0, 100)}{selectedText.length > 100 ? '...' : ''}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Thinking Section */}
          {state.isAnalyzing && !state.thinking && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}

          {state.thinking && (
            <ThinkingSection
              thinking={state.thinking}
              isExpanded={isThinkingExpanded}
              onToggle={() => setIsThinkingExpanded(!isThinkingExpanded)}
            />
          )}

          {/* Content Section */}
          {state.content && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{state.content}</div>
            </div>
          )}

          {/* Sources Section */}
          {hasSources && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Sources</h4>
              <div className="space-y-2">
                {state.sources.map((source, index) => (
                  <div key={source.refer} className="text-xs">
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      [{index + 1}] {source.title}
                    </a>
                    <p className="text-muted-foreground mt-1 line-clamp-2">
                      {source.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {state.error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              <p className="text-sm font-medium">Analysis failed</p>
              <p className="text-xs mt-1">{state.error}</p>
            </div>
          )}

          {/* Empty State */}
          {!state.isAnalyzing && !state.thinking && !state.content && !state.error && (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Starting analysis...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          {state.content && (
            <Button size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
