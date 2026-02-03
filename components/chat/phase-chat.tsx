"use client";

import { ReactNode, RefObject, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { ChatMessageWithRetry } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import type { ChatMessage } from "@/types/innovation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SuggestionChip {
  label: string;
  action: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "secondary";
  icon?: LucideIcon;
}

export interface PhaseChatProps {
  /** Title of the chat panel */
  title?: string;
  /** Subtitle/status text */
  subtitle?: string;
  /** Chat messages to display */
  messages: ChatMessage[];
  /** Current input value */
  inputValue: string;
  /** Input change handler */
  onInputChange: (value: string) => void;
  /** Send message handler */
  onSendMessage: () => void | Promise<void>;
  /** Loading state for AI response */
  isLoading?: boolean;
  /** Retry handler for failed messages */
  onRetry?: () => void;
  /** Callback when user clicks "Use this" on selected text */
  onCopyToInput?: (text: string) => void;
  /** Suggestion chips to show */
  suggestionChips?: SuggestionChip[];
  /** Suggestion section title */
  suggestionTitle?: string;
  /** Suggestion icon element */
  suggestionIcon?: ReactNode;
  /** Additional content to show above input */
  aboveInputContent?: ReactNode;
  /** Ref for the chat container (for auto-scroll) */
  chatContainerRef?: RefObject<HTMLDivElement>;
  /** Ref for messages end (for auto-scroll) */
  messagesEndRef?: RefObject<HTMLDivElement>;
  /** Ref for the input textarea */
  inputRef?: RefObject<HTMLTextAreaElement>;
  /** Placeholder text for input */
  placeholder?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * PhaseChat - Shared chat interface component for all wizard phases
 *
 * Provides:
 * - Chat header with title and subtitle
 * - Scrollable message area with auto-scroll
 * - Typing indicator during loading
 * - Message retry for errors
 * - Suggestion chips
 * - Textarea input with send button
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 *
 * @example
 * ```tsx
 * <PhaseChat
 *   title="AI Consultant"
 *   subtitle="Ready to help"
 *   messages={messages}
 *   inputValue={inputValue}
 *   onInputChange={setInputValue}
 *   onSendMessage={handleSendMessage}
 *   isLoading={isLoading}
 *   onRetry={handleRetry}
 *   suggestionChips={[
 *     { label: "Generate ideas", action: handleGenerate },
 *   ]}
 *   suggestionTitle="Generate your ideas:"
 *   placeholder="Ask me anything..."
 * />
 * ```
 */
export function PhaseChat({
  title = "Chat",
  subtitle = "",
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading = false,
  onRetry,
  onCopyToInput,
  suggestionChips = [],
  suggestionTitle,
  suggestionIcon,
  aboveInputContent,
  chatContainerRef,
  messagesEndRef,
  inputRef,
  placeholder = "Type your message...",
  disabled = false,
  className,
}: PhaseChatProps) {
  // Internal refs for auto-scrolling (fallback if parent doesn't provide refs)
  const internalChatContainerRef = useRef<HTMLDivElement>(null);
  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRefToUse = chatContainerRef || internalChatContainerRef;
  const messagesEndRefToUse = messagesEndRef || internalMessagesEndRef;

  // Auto-scroll to bottom when messages change or during loading
  useEffect(() => {
    if (chatContainerRefToUse.current) {
      chatContainerRefToUse.current.scrollTop = chatContainerRefToUse.current.scrollHeight;
    }
  }, [messages, isLoading, chatContainerRefToUse]);

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && inputValue.trim()) {
        onSendMessage();
      }
    }
  };

  // Get chip styling based on variant
  const getChipClassName = (variant: SuggestionChip["variant"]) => {
    switch (variant) {
      case "primary":
        return "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 dark:border-green-600 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900";
      case "secondary":
        return "border-border bg-white text-foreground hover:bg-muted dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900";
      default:
        return "border-border bg-white text-muted-foreground hover:bg-muted dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700";
    }
  };

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      {/* Chat Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-background/95">
        <h2 className="text-sm font-medium">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Scrollable Chat Area */}
      <div ref={chatContainerRefToUse} className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="space-y-4">
          {messages
            .filter((message) => {
              // Filter out messages with no real content
              const content = message.content.trim();
              if (content === "") return false;

              // Filter out messages that only contain code block markers (e.g., ```, ```json)
              const withoutCodeBlocks = content.replace(/```[\w]*\n?/g, "").trim();
              return withoutCodeBlocks !== "";
            })
            .map((message) => (
              <ChatMessageWithRetry
                key={message.id}
                message={message}
                isLoading={isLoading}
                onRetry={onRetry}
                onCopyToInput={onCopyToInput}
              />
            ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRefToUse} />
        </div>
      </div>

      {/* Suggestion Chips */}
      {suggestionChips.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {suggestionChips.map((chip, index) => {
              const Icon = chip.icon;
              return (
                <button
                  key={index}
                  onClick={chip.action}
                  disabled={chip.disabled || isLoading}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    getChipClassName(chip.variant)
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Above Input Content */}
      {aboveInputContent && (
        <div className="flex-shrink-0 px-4 pb-2">
          {aboveInputContent}
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-background/95">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[48px] max-h-[100px] resize-y text-sm"
            disabled={disabled || isLoading}
          />
          <Button
            onClick={onSendMessage}
            disabled={!inputValue.trim() || isLoading || disabled}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
