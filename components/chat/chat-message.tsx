import { RefreshCw, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types/innovation";
import { useState, useCallback, useRef } from "react";

interface ChatMessageWithRetryProps {
  message: ChatMessage;
  isLoading?: boolean;
  onRetry?: () => void;
  /** Callback when user clicks "Use this" on selected text */
  onCopyToInput?: (text: string) => void;
}

/**
 * Check if text is worth copying (not empty, not just punctuation, etc.)
 */
function isTextWorthCopying(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (trimmed.length > 500) return false;
  // Skip if it's just common filler words
  const fillerWords = /^(the|a|an|and|or|but|so|yes|no|ok|okay|sure|thanks|please)$/i;
  if (fillerWords.test(trimmed)) return false;
  return true;
}

/**
 * Error detection keywords to identify error messages
 */
const ERROR_KEYWORDS = [
  "error",
  "sorry",
  "failed",
  "timeout",
  "unavailable",
  "credit limit",
  "api key",
  "network error",
  "server error"
];

/**
 * Check if a message content contains error indicators
 */
export function isErrorMessage(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return ERROR_KEYWORDS.some(keyword => lowerContent.includes(keyword));
}

/**
 * Chat Message Component with Retry Button
 *
 * Displays a chat message and optionally shows a retry button
 * below error messages for assistant messages.
 *
 * Also supports hover-to-copy - when user hovers over text in assistant messages,
 * the text gets highlighted and clicking it copies it to the input.
 *
 * @param message - The chat message to display
 * @param isLoading - Whether a request is currently in progress
 * @param onRetry - Callback function when retry button is clicked
 * @param onCopyToInput - Callback function when text is clicked to copy to input
 */
export function ChatMessageWithRetry({ message, isLoading = false, onRetry, onCopyToInput }: ChatMessageWithRetryProps) {
  const isAssistant = message.role === "assistant";
  const hasError = isAssistant && isErrorMessage(message.content || "");
  const showRetry = hasError && !isLoading && onRetry;
  const canCopy = isAssistant && onCopyToInput;

  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-3 relative ${
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-sm leading-relaxed last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="text-sm leading-relaxed my-2 ml-4 list-disc space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="text-sm leading-relaxed my-2 ml-4 list-decimal space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm leading-relaxed">{children}</li>
              ),
              strong: ({ children }) => {
                const text = String(children).trim();
                const clickable = canCopy && isTextWorthCopying(text);
                return (
                  <strong
                    className={`font-semibold cursor-pointer transition-colors rounded px-1 -mx-1 ${
                      clickable ? "hover:bg-black/5 dark:hover:bg-white/10" : ""
                    }`}
                    onClick={() => clickable && onCopyToInput!(text)}
                    title={clickable ? "Click to use" : undefined}
                  >
                    {children}
                  </strong>
                );
              },
              em: ({ children }) => {
                const text = String(children).trim();
                const clickable = canCopy && isTextWorthCopying(text);
                return (
                  <em
                    className={`italic cursor-pointer transition-colors rounded px-1 -mx-1 ${
                      clickable ? "hover:bg-black/5 dark:hover:bg-white/10" : ""
                    }`}
                    onClick={() => clickable && onCopyToInput!(text)}
                    title={clickable ? "Click to use" : undefined}
                  >
                    {children}
                  </em>
                );
              },
              code: (props: any) =>
                props.inline ? (
                  <code className="px-1 py-0.5 rounded text-xs font-mono bg-black/10 dark:bg-white/20">{props.children}</code>
                ) : (
                  <code className={props.className}>{props.children}</code>
                ),
              pre: ({ children }) => (
                <pre className="bg-black/5 dark:bg-white/10 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">{children}</pre>
              ),
              h1: ({ children }) => (
                <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic my-2 text-muted-foreground">{children}</blockquote>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
              ),
              table: ({ children }) => (
                <div className="my-2 overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b bg-muted/50">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody>{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="border-b last:border-b-0">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-2 py-1 text-left font-medium">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-2 py-1">{children}</td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {/* Show retry button for error messages */}
        {showRetry && (
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Retry your last message"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}
