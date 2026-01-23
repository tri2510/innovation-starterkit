"use client";

import { ReactNode, useRef, useEffect, useState, ForwardedRef, useImperativeHandle } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/types/innovation";

export interface SplitLayoutProps {
  chatTitle: string;
  chatDescription: string;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  children: ReactNode;
  inputPlaceholder?: string;
  floatingActions?: ReactNode;
  inputRef?: ForwardedRef<HTMLTextAreaElement>;
}

export function SplitLayout({
  chatTitle,
  chatDescription,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  children,
  inputPlaceholder = "Type your response... (Enter to send)",
  floatingActions,
  inputRef,
}: SplitLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const [questionCount, setQuestionCount] = useState(0);

  // Expose the input ref to the parent
  useImperativeHandle(inputRef, () => internalInputRef.current as HTMLTextAreaElement);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Count AI messages (questions)
  useEffect(() => {
    const count = messages.filter(m => m.role === "assistant").length;
    setQuestionCount(count);
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <main className="flex-1 flex min-h-0 w-full">
      {/* Left Panel - Chat Area */}
      <div className="w-[420px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{chatTitle}</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{chatDescription}</p>
        </div>

        {/* Scrollable Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-md px-4 py-2.5 text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-md px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-end gap-2">
            <Textarea
              ref={internalInputRef}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={inputPlaceholder}
              className="min-h-[48px] max-h-[100px] resize-y text-sm disabled:cursor-text"
              disabled={isLoading}
            />
            <Button
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isLoading}
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

      {/* Right Panel - Content Area */}
      <div className="flex-1 flex flex-col relative min-h-0 bg-white dark:bg-neutral-900/30">
        <div className="flex-1 overflow-y-auto">
          {children}
          {/* Spacer for floating actions */}
          {floatingActions && <div className="h-24" />}
        </div>

        {/* Floating Actions Bar */}
        {floatingActions && (
          <div className="absolute bottom-0 left-0 right-0 bg-background pt-8 pb-4 px-8 border-t border-neutral-200 dark:border-neutral-800 z-10">
            <div className="max-w-6xl mx-auto">{floatingActions}</div>
          </div>
        )}
      </div>
    </main>
  );
}
