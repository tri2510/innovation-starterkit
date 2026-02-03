"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Brain, History, Send, X, Globe, Search, Trash2, CheckCircle2, Tag, ExternalLink } from "lucide-react"
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
    return content
  }

  let transformed = content

  // Replace [Source: ref_X] patterns with markdown links [X](url)
  transformed = transformed.replace(/\[Source:\s*ref[_\s]*(\d+)\]/gi, (match, refNum) => {
    const index = parseInt(refNum) - 1
    if (index >= 0 && index < sources.length) {
      return `[${index + 1}](${sources[index].link})`
    }
    return match
  })

  return transformed
}

export function EnhancedAnalysisPanel({ isOpen, onClose, selectedText, phaseContext }: EnhancedAnalysisPanelProps) {
  const [messages, setMessages] = useState<CrackItMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<AnalysisHistory[]>([])
  const [useWebSearch, setUseWebSearch] = useState(true)
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())

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
      setUseWebSearch(true)
    }
  }, [isOpen])

  // Auto-expand first 3 sources by default
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.sources && lastMessage.sources.length > 0) {
        setExpandedSources(new Set([0, 1, 2]))
      }
    }
  }, [messages])

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

    // Reset streaming refs
    streamingThinkingRef.current = ""
    streamingContentRef.current = ""
    streamingSearchQueryRef.current = ""
    streamingSourcesRef.current = []
    isSearchingRef.current = false
    hasShownFirstThinkingRef.current = false

    // Add user message
    const userMessage: CrackItMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    }

    // Add empty assistant message that will be streamed into
    const assistantMessage: CrackItMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now() + 1}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
      streamPhase: "thinking",
      isSearching: useWebSearch,
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    currentAnalysisRef.current = selectedText

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
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze selection")
      }

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
              } else if (parsed.type === "status") {
                // Update message with current status
                setMessages(prev => {
                  if (prev.length === 0 || prev[prev.length - 1].role !== "assistant") return prev
                  const updated = [...prev]
                  const last = { ...updated[updated.length - 1] }
                  last.statusMessage = parsed.data.message
                  last.statusStage = parsed.data.stage
                  updated[updated.length - 1] = last
                  return updated
                })
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

  const saveToHistory = (currentMessages: CrackItMessage[]) => {
    const item: AnalysisHistory = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist-${Date.now()}`,
      selectedText: currentAnalysisRef.current,
      messages: currentMessages,
      timestamp: Date.now()
    }

    setHistory(prev => {
      const filtered = prev.filter(h => h.selectedText !== currentAnalysisRef.current)
      const updated = [item, ...filtered].slice(0, MAX_HISTORY)

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error("Failed to save history:", e)
      }

      return updated
    })
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

  // Load history on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load history:", e)
    }
  }, [])

  const toggleSource = (index: number) => {
    setExpandedSources(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 gap-0 bg-slate-50 dark:bg-slate-950">
        {/* Header with gradient */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <CrackItIcon size={20} />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-white m-0">Crack It</SheetTitle>
              <SheetDescription className="text-violet-100 text-xs m-0">
                {selectedText ? `Analyzing: "${selectedText.slice(0, 40)}${selectedText.length > 40 ? "..." : ""}"` : "AI-powered insights"}
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* History Panel */}
          {showHistory && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">History</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearHistory}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No history yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <p className="text-xs font-medium line-clamp-1">{item.selectedText}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Web Search Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-medium">Web Search</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-3 text-xs font-medium transition-all",
                useWebSearch
                  ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              )}
              onClick={() => setUseWebSearch(!useWebSearch)}
            >
              {useWebSearch ? "ON" : "OFF"}
            </Button>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white ml-8 p-3"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mr-0 p-4 space-y-4 shadow-sm"
                )}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    {/* Status Badge - shows real-time progress */}
                    {(msg.isSearching || msg.sources || msg.statusMessage) && (
                      <div className="flex items-center gap-2">
                        {msg.isSearching || msg.statusStage === "searching" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium animate-pulse">
                            <Globe className="h-3 w-3 animate-spin" />
                            {msg.statusMessage || "Searching..."}
                          </div>
                        ) : msg.sources && msg.sources.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            {msg.sources.length} sources found
                          </div>
                        ) : msg.statusMessage ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-medium">
                            <Brain className="h-3 w-3 animate-pulse" />
                            {msg.statusMessage}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Search Query Badge */}
                    {msg.searchQuery && (
                      <div className="inline-flex items-start gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                        <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Search Query</p>
                          <p className="text-sm text-blue-900 dark:text-blue-100 font-mono break-words mt-0.5">
                            {msg.searchQuery}
                          </p>
                        </div>
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
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-sm prose-headings:text-sm prose-li:text-sm">
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
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all align-middle mx-0.5 no-underline"
                                      title={source.title}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        window.open(source.link, '_blank')
                                      }}
                                      {...props}
                                    >
                                      [{citationMatch[1]}]
                                      <ExternalLink className="h-3 w-3" />
                                      <span className="max-w-[80px] truncate font-normal opacity-90">
                                        {hostname}
                                      </span>
                                    </a>
                                  )
                                }
                              }

                              // Regular link
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

                    {/* Sources Section - Always visible if sources exist */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-violet-600" />
                            Sources
                          </h4>
                          <span className="text-xs text-muted-foreground">{msg.sources.length} results</span>
                        </div>

                        <div className="space-y-2">
                          {msg.sources.map((source, i) => {
                            const isExpanded = expandedSources.has(i)
                            const hostname = source.link.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

                            return (
                              <div
                                key={i}
                                className="group rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md"
                              >
                                {/* Header - always visible, clickable */}
                                <a
                                  href={source.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                  onClick={(e) => {
                                    // Don't trigger expand when clicking the link
                                    e.stopPropagation()
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Number badge */}
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                                      {i + 1}
                                    </span>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {source.title}
                                      </h5>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                                          {source.media || hostname}
                                        </span>
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                      </div>
                                    </div>
                                  </div>
                                </a>

                                {/* Expandable content */}
                                {source.content && source.content.length > 0 && (
                                  <div className="border-t border-slate-200 dark:border-slate-700">
                                    <button
                                      onClick={() => toggleSource(i)}
                                      className="w-full px-3 py-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                      <span>{isExpanded ? "Hide summary" : "Show summary"}</span>
                                      <span className={cn("transition-transform", isExpanded && "rotate-180")}>
                                        ▼
                                      </span>
                                    </button>

                                    {isExpanded && (
                                      <div className="px-3 pb-3">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                          {source.content.slice(0, 300)}
                                          {source.content.length > 300 && "..."}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-violet-600" />
                <p className="text-sm text-muted-foreground mt-2">Analyzing...</p>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
              placeholder="Ask a follow-up question..."
              className="min-h-[50px] max-h-[120px] resize-none text-sm border-slate-300 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500"
              disabled={isLoading}
            />
            <Button
              onClick={() => analyzeSelection()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[50px] w-[50px] flex-shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearChat}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear chat
            </Button>

            {selectedText && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                onClick={() => analyzeSelection()}
                disabled={isLoading}
              >
                <CrackItIcon size={14} className="mr-1" />
                Analyze selection
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
