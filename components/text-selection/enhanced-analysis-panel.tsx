"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Brain, History, Send, X, Globe, Search, Trash2, CheckCircle2, Tag } from "lucide-react"
import { CrackItIcon } from "./crack-it-icon"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet/sheet"
import { ThinkingSection } from "./thinking-section"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getSession, getCrackItConversationHistory, saveCrackItConversationHistory, clearCrackItConversationHistory } from "@/lib/session"
import type { CrackItMessage } from "@/types/innovation"

interface AnalysisHistory {
  id: string
  selectedText: string
  messages: CrackItMessage[]
  timestamp: number
}

interface EnhancedAnalysisPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  phaseContext?: {
    phase: string
    challenge?: any
    market?: any
    idea?: any
  }
}

const STORAGE_KEY = "text-analysis-history"
const MAX_HISTORY = 10
const STREAM_UPDATE_INTERVAL = 10

// Helper to transform content with clickable citations (like ChatGPT)
function transformContentWithCitations(content: string, sources: Array<{ refer: string; link: string; title: string }>): string {
  if (!sources || sources.length === 0) {
    console.log('[transformContentWithCitations] No sources, returning original content')
    return content
  }

  console.log('[transformContentWithCitations] Sources:', sources.map((s, i) => `${i}: ${s.refer}`))
  console.log('[transformContentWithCitations] Content preview (first 200 chars):', content.substring(0, 200))

  // Check what citation patterns are in the content
  const citationPatterns = content.match(/\[Source:[^\]]+\]/gi)
  console.log('[transformContentWithCitations] Found citation patterns:', citationPatterns)

  let transformed = content
  let replacedCount = 0

  // Replace [Source: ref_X] patterns with markdown links [X](url)
  // Case insensitive, handles various spacing
  transformed = transformed.replace(/\[Source:\s*ref[_\s]*(\d+)\]/gi, (match, refNum) => {
    const index = parseInt(refNum) - 1
    console.log(`[transformContentWithCitations] Trying to replace ref_${refNum} with index ${index}`)
    if (index >= 0 && index < sources.length) {
      replacedCount++
      const result = `[${index + 1}](${sources[index].link})`
      console.log(`[transformContentWithCitations] ✓ Replaced with:`, result)
      return result
    }
    console.warn(`[transformContentWithCitations] ✗ Invalid ref number: ${refNum} (sources length: ${sources.length})`)
    return match // Keep original if invalid
  })

  console.log(`[transformContentWithCitations] Replaced ${replacedCount} citations total`)
  console.log('[transformContentWithCitations] Output preview (first 200 chars):', transformed.substring(0, 200))

  return transformed
}

export function EnhancedAnalysisPanel({
  isOpen,
  onClose,
  selectedText,
  phaseContext
}: EnhancedAnalysisPanelProps) {
  const [messages, setMessages] = useState<CrackItMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const [useWebSearch, setUseWebSearch] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<AnalysisHistory[]>([])

  const currentAnalysisRef = useRef<string>("")

  // Use refs to accumulate streaming content
  const streamingThinkingRef = useRef("")
  const streamingContentRef = useRef("")
  const streamingSearchQueryRef = useRef("")
  const streamingSourcesRef = useRef<Array<{
    refer: string
    title: string
    link: string
    media: string
    content: string
    icon: string
    publish_date: string
  }>>([])
  const streamingDebugEventsRef = useRef<Array<{
    step: string
    timestamp: number
    data: any
  }>>([])
  const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSearchingRef = useRef(false)
  const hasShownFirstThinkingRef = useRef(false)

  // Load Crack It messages from session
  useEffect(() => {
    if (isOpen) {
      const sessionMessages = getCrackItConversationHistory()
      setMessages(sessionMessages)
      setInput("")
      setShowThinking(false)
      setShowHistory(false)
    }
  }, [isOpen])

  // Load history from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AnalysisHistory[]
        const hasOldFormat = parsed.some(item =>
          item.id.startsWith('analysis-') && item.id.match(/^analysis-\d+$/)
        )
        if (hasOldFormat) {
          sessionStorage.removeItem(STORAGE_KEY)
          setHistory([])
        } else {
          setHistory(parsed)
        }
      }
    } catch (e) {
      console.error("Failed to load history:", e)
    }
  }, [])

  // Save to history
  const saveToHistory = useCallback((msgs: CrackItMessage[]) => {
    const now = Date.now()
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `analysis-${now}-${Math.random().toString(36).slice(2, 11)}`
    const newHistory: AnalysisHistory = {
      id: uniqueId,
      selectedText,
      messages: msgs,
      timestamp: now
    }

    setHistory(prev => {
      const updated = [newHistory, ...prev].slice(0, MAX_HISTORY)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error("Failed to save history:", e)
      }
      return updated
    })
  }, [selectedText])

  // Throttled UI update for streaming
  const updateStreamingMessage = useCallback((phase?: "thinking" | "content" | "done") => {
    setMessages(prev => {
      if (prev.length === 0 || prev[prev.length - 1].role !== "assistant") {
        return prev
      }

      const updated = [...prev]
      const last = { ...updated[updated.length - 1] }

      const hasThinkingNow = streamingThinkingRef.current && streamingThinkingRef.current.length > 0
      const hadThinkingBefore = last.thinking && last.thinking.length > 0

      if (hasThinkingNow && last.thinking !== streamingThinkingRef.current) {
        last.thinking = streamingThinkingRef.current
        if (!hadThinkingBefore && hasThinkingNow) {
          setShowThinking(true)
        }
      }
      if (streamingContentRef.current && last.content !== streamingContentRef.current) {
        last.content = streamingContentRef.current
      }
      if (streamingSearchQueryRef.current && last.searchQuery !== streamingSearchQueryRef.current) {
        last.searchQuery = streamingSearchQueryRef.current
      }
      if (streamingSourcesRef.current.length > 0) {
        last.sources = [...streamingSourcesRef.current]
        last.isSearching = false
      }
      if (streamingDebugEventsRef.current.length > 0) {
        last.debugEvents = [...streamingDebugEventsRef.current]
      }
      last.isSearching = isSearchingRef.current

      if (phase) {
        last.streamPhase = phase
        last.isStreaming = phase !== "done"
      }

      updated[updated.length - 1] = last
      return updated
    })
  }, [])

  const scheduleUpdate = useCallback((phase?: "thinking" | "content" | "done") => {
    if (streamingTimeoutRef.current) {
      return
    }

    streamingTimeoutRef.current = setTimeout(() => {
      updateStreamingMessage(phase)
      streamingTimeoutRef.current = null
    }, STREAM_UPDATE_INTERVAL)
  }, [updateStreamingMessage])

  // Auto-save messages to session storage
  useEffect(() => {
    try {
      saveCrackItConversationHistory(messages)
    } catch (e) {
      console.error("Failed to save chat to session:", e)
    }
  }, [messages])

  const clearChat = () => {
    setMessages([])
    setInput("")
    setShowThinking(false)
    try {
      clearCrackItConversationHistory()
    } catch (e) {
      console.error("Failed to clear chat:", e)
    }
  }

  const analyzeSelection = async (userInput?: string) => {
    const prompt = userInput || input || `Analyze this selection: "${selectedText}"`
    setIsLoading(true)

    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current)
      streamingTimeoutRef.current = null
    }

    streamingThinkingRef.current = ""
    streamingContentRef.current = ""
    streamingSearchQueryRef.current = ""
    streamingSourcesRef.current = []
    hasShownFirstThinkingRef.current = false

    const userMessage: CrackItMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])

    const assistantPlaceholder: CrackItMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      role: "assistant",
      content: "",
      thinking: "",
      sources: [],
      timestamp: Date.now(),
      isSearching: useWebSearch,
      isStreaming: true,
      streamPhase: "thinking"
    }

    isSearchingRef.current = useWebSearch
    setMessages(prev => [...prev, assistantPlaceholder])

    try {
      const sessionData = getSession()

      const response = await fetch("/api/ai/analyze-selection-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText,
          messages: [...messages, userMessage],
          useWebSearch,
          phaseContext,
          sessionData
        })
      })

      if (!response.ok) throw new Error("Analysis failed")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response")

      const decoder = new TextDecoder()
      let buffer = ""
      let eventCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              eventCount++

              if (parsed.type === "thinking") {
                streamingThinkingRef.current += parsed.content
                if (!hasShownFirstThinkingRef.current) {
                  hasShownFirstThinkingRef.current = true
                  updateStreamingMessage("thinking")
                } else {
                  scheduleUpdate("thinking")
                }
              } else if (parsed.type === "content") {
                streamingContentRef.current += parsed.content
                if (!streamingContentRef.current || streamingContentRef.current.length === parsed.content.length) {
                  updateStreamingMessage("content")
                } else {
                  scheduleUpdate("content")
                }
              } else if (parsed.type === "searchQuery") {
                streamingSearchQueryRef.current = parsed.data
                scheduleUpdate("content")
              } else if (parsed.type === "sources") {
                streamingSourcesRef.current = parsed.data
                isSearchingRef.current = false
                scheduleUpdate("content")
              } else if (parsed.type === "debug") {
                streamingDebugEventsRef.current = parsed.data
                scheduleUpdate("content")
              } else if (parsed.type === "done") {
                isSearchingRef.current = false
                updateStreamingMessage("done")
              } else if (parsed.type === "error") {
                throw new Error(parsed.message)
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        }
      }

      setMessages(prev => {
        saveToHistory(prev)
        return prev
      })

    } catch (error) {
      console.error("Analysis error:", error)
      setMessages(prev => [...prev, {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        streamPhase: "done",
        isStreaming: false
      }])
    } finally {
      setIsLoading(false)
      setInput("")

      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current)
        streamingTimeoutRef.current = null
      }
    }
  }

  const loadFromHistory = (item: AnalysisHistory) => {
    currentAnalysisRef.current = item.selectedText
    setMessages(item.messages)
    setShowHistory(false)
  }

  const clearHistory = () => {
    setHistory([])
    sessionStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 sm:max-w-[480px] w-full gap-0"
        style={{ boxShadow: "-4px 0 24px -8px rgba(0,0,0,0.1)" }}
      >
        {/* Compact Header */}
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <CrackItIcon size={18} />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold flex items-center gap-2">
                  Crack It
                  {useWebSearch && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <Globe className="h-2.5 w-2.5" />
                      Search On
                    </span>
                  )}
                </SheetTitle>
                {selectedText && (
                  <SheetDescription className="line-clamp-1 text-xs mt-0.5">
                    {selectedText.slice(0, 60)}{selectedText.length > 60 ? "..." : ""}
                  </SheetDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="h-8 px-2 text-xs"
              >
                <History className="h-3.5 w-3.5 mr-1" />
                History
                {history.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 rounded-full bg-primary/20 text-primary text-[10px]">
                    {history.length}
                  </span>
                )}
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant={useWebSearch ? "default" : "outline"}
              size="sm"
              onClick={() => setUseWebSearch(!useWebSearch)}
              className="h-7 px-2.5 text-xs"
            >
              <Search className="h-3 w-3 mr-1" />
              {useWebSearch ? "Search On" : "Search Off"}
            </Button>
            <span className="text-[10px] text-muted-foreground px-2 py-1 rounded bg-muted/30">
              {phaseContext?.phase || "unknown"}
            </span>
          </div>
        </SheetHeader>

        {/* Content Area - No Auto Scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* History Panel */}
          {showHistory && (
            <div className="p-3 border-b bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-xs">Recent Analyses</h3>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-6 px-2 text-[10px]"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-2.5 rounded-lg bg-background hover:bg-accent transition-colors border border-border/50"
                  >
                    <div className="text-[10px] text-muted-foreground mb-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs line-clamp-2 text-foreground">
                      {item.selectedText.slice(0, 80)}...
                    </div>
                  </button>
                ))}
                {history.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    No recent analyses
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="p-4 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
                  <CrackItIcon size={36} />
                </div>
                <h3 className="font-semibold text-sm mb-2">What would you like to explore?</h3>
                <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto">
                  {selectedText
                    ? "Ask me anything about the selected text. I'll provide insights with real web search."
                    : "Ask me anything about your innovation project."}
                </p>
                {selectedText && (
                  <Button
                    onClick={() => analyzeSelection("Analyze this selection")}
                    size="sm"
                    className="h-8"
                  >
                    <CrackItIcon size={16} />
                    Analyze Selection
                  </Button>
                )}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={cn(
                "rounded-xl",
                msg.role === "user"
                  ? "bg-primary ml-12 p-3"
                  : "bg-muted/30 mr-0 p-4 space-y-3"
              )}>
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    {/* Status indicator - compact */}
                    {(msg.isSearching || msg.sources || msg.streamPhase === "done") && (
                      <div className="flex items-center gap-2">
                        {msg.isSearching ? (
                          <div className="flex items-center gap-1.5 text-xs text-blue-500">
                            <Globe className="h-3 w-3 animate-pulse" />
                            <span>Searching...</span>
                          </div>
                        ) : msg.sources && msg.sources.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{msg.sources.length} sources found</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Loading indicator */}
                    {msg.isStreaming && !msg.thinking && !msg.content && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Brain className="h-3 w-3 animate-pulse" />
                        <span>Thinking...</span>
                      </div>
                    )}

                    {/* Search Keywords Section */}
                    {msg.searchQuery && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 mb-0.5">Keywords</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 break-words" title={msg.searchQuery}>
                            {msg.searchQuery}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Debug Events Section - Process Transparency */}
                    {msg.debugEvents && msg.debugEvents.length > 0 && (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <details className="group">
                          <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-1.5">
                              <Search className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                Process Steps ({msg.debugEvents.length})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">
                              ▼
                            </span>
                          </summary>
                          <div className="p-2 pt-0 space-y-1.5">
                            {msg.debugEvents.map((event, i) => (
                              <div key={i} className="text-[10px] font-mono bg-white dark:bg-slate-950 rounded p-1.5 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded font-semibold",
                                    event.step === "context_built" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                                    event.step === "query_generation_start" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                                    event.step === "query_generated" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                                    event.step === "query_generation_failed" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                                    event.step === "search_starting" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                                    event.step === "search_completed" && "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                                  )}>
                                    {event.step.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <pre className="text-[9px] text-slate-600 dark:text-slate-400 overflow-auto whitespace-pre-wrap break-words">
                                  {JSON.stringify(event.data, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Thinking Section */}
                    {msg.thinking && (
                      <ThinkingSection
                        thinking={msg.thinking}
                        isExpanded={showThinking}
                        onToggle={() => setShowThinking(!showThinking)}
                      />
                    )}

                    {/* Content with clickable citations */}
                    {msg.content && (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-xs prose-headings:text-xs prose-li:text-xs">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Make citations like [1], [2] clickable and styled with URL
                            a: ({ href, children, ...props }) => {
                              const text = String(children).trim()

                              // Check if this is a citation link (number-only like [1], [2])
                              const citationMatch = text.match(/^\[(\d+)\]$/)

                              if (citationMatch && msg.sources && msg.sources.length > 0) {
                                const sourceIndex = parseInt(citationMatch[1]) - 1
                                if (sourceIndex >= 0 && sourceIndex < msg.sources.length) {
                                  const source = msg.sources[sourceIndex]
                                  // Extract hostname for display
                                  const hostname = source.link.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
                                  return (
                                    <a
                                      href={source.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-medium text-xs transition-colors no-underline align-middle"
                                      title={source.title}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        window.open(source.link, '_blank')
                                      }}
                                      {...props}
                                    >
                                      [{citationMatch[1]}]
                                      <span className="text-[10px] opacity-75 max-w-[100px] truncate">
                                        {hostname}
                                      </span>
                                    </a>
                                  )
                                }
                              }

                              // Regular link - open in new tab
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                  {...props}
                                >
                                  {children}
                                </a>
                              )
                            }
                          }}
                        >
                          {transformContentWithCitations(msg.content, msg.sources || [])}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Sources - Show ALL sources (ChatGPT style) */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-border/50">
                        <details
                          className="group"
                          open={false} // Default collapsed - click to expand
                        >
                          <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors list-none mb-2">
                            <span className="flex items-center gap-1.5">
                              <Globe className="h-3 w-3" />
                              Sources ({msg.sources.length})
                            </span>
                            <span className="opacity-50 group-hover:opacity-100 text-[10px]">(Click to expand)</span>
                          </summary>
                          <div className="space-y-2">
                            {msg.sources.map((source, i) => (
                              <a
                                key={i}
                                href={source.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2.5 rounded-lg bg-background/50 hover:bg-accent/50 border border-border/30 transition-all text-xs group-hover:border-primary/30"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                                    {i + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground line-clamp-2 text-xs">{source.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {source.media || new URL(source.link).hostname}
                                    </p>
                                    {source.content && source.content.length > 0 && (
                                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                                        {source.content.slice(0, 150)}...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim() && !isLoading) {
                    analyzeSelection()
                  }
                }
              }}
              placeholder="Ask a question..."
              className="min-h-[44px] max-h-[100px] resize-none text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={() => analyzeSelection()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[44px] w-[44px] flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
