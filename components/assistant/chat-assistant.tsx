"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, X, Minimize2, Maximize2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/innovation";

interface ChatAssistantProps {
  title: string;
  description: string;
  placeholder?: string;
  context?: string;
  apiEndpoint: string;
  initialMessage?: string;
  position?: "bottom-right" | "left" | "right";
  expanded?: boolean;
}

export function ChatAssistant({
  title,
  description,
  placeholder = "Ask me anything about this step...",
  context = "",
  apiEndpoint,
  initialMessage,
  position = "bottom-right",
  expanded = false,
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!expanded);
  const [isClosed, setIsClosed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: initialMessage,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [initialMessage, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: inputValue,
          conversationHistory: messages.map(({ id, ...rest }) => rest),
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      const aiMessageId = "ai-" + Date.now();

      // Add placeholder AI message
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        },
      ]);

      if (!reader) {
        throw new Error("No response body");
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullResponse += decoder.decode(value, { stream: true });

        // Update the AI message content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, content: fullResponse } : m
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isClosed) {
    return (
      <button
        onClick={() => setIsClosed(false)}
        className={cn(
          "fixed z-50 flex items-center gap-2 px-4 py-3 rounded-md transition-all",
          "bg-blue-600 text-white hover:bg-blue-700",
          position === "bottom-right" && "bottom-6 right-6",
          position === "left" && "bottom-6 left-6 top-auto",
          position === "right" && "bottom-6 right-6 top-auto"
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="font-medium">Assistant</span>
        <Badge variant="secondary" className="ml-1">
          {messages.filter((m) => m.role === "user").length}
        </Badge>
      </button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed z-50 transition-all duration-300",
        "max-w-md w-full",
        position === "bottom-right" && "bottom-6 right-6 top-auto",
        position === "left" && "bottom-6 left-6 top-auto max-h-[80vh]",
        position === "right" && "bottom-6 right-6 top-auto max-h-[80vh]",
        isMinimized && "h-auto"
      )}
    >
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsClosed(true);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isMinimized && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      {!isMinimized && (
        <CardContent className="pt-0">
          {/* Messages */}
          <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "p-3 rounded-lg text-sm whitespace-pre-wrap",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-muted mr-8"
                )}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-muted p-3 rounded-lg mr-8">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-10 w-10 self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
