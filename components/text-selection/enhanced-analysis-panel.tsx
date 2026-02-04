"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Brain, History, Send, X, Globe, Search, Trash2, CheckCircle2, ExternalLink, ChevronDown } from "lucide-react"
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

  // Auto-expand sources by default - now disabled, summaries hidden by default
  // useEffect(() => {
  //   if (messages.length > 0) {
  //     const lastMessage = messages[messages.length - 1]
  //     if (lastMessage?.sources && lastMessage.sources.length > 0) {
  //       setExpandedSources(new Set([0, 1, 2]))
  //     }
  //   }
  // }, [messages])

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

      // Auto-collapse thinking when content starts streaming
      const hasNewContent = streamingContentRef.current && streamingContentRef.current.length > 0
      const hadNoContentBefore = !last.content || last.content.length === 0

      if (hasNewContent && last.content !== streamingContentRef.current) {
        last.content = streamingContentRef.current
        // Collapse thinking when first content arrives
        if (showThinking && hadNoContentBefore) {
          setShowThinking(false)
        }
      }

      // Auto-collapse thinking when phase changes to content
      if (phase === "content" && showThinking) {
        setShowThinking(false)
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
  }, [showThinking])

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
        {/* Header */}
        <div className="relative flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <CrackItIcon size={32} />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-foreground m-0">Crack It</SheetTitle>
              <SheetDescription className="text-muted-foreground text-xs m-0">
                {selectedText ? `Analyzing: "${selectedText.slice(0, 40)}${selectedText.length > 40 ? "..." : ""}"` : "AI-powered insights"}
              </SheetDescription>
            </div>
          </div>
          {/* History Button - positioned below close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-12 h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* History Panel */}
          {showHistory && (
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
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
                <p className="text-xs text-muted-foreground text-center py-3">No history yet</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
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

          {/* Messages */}
          <div className="space-y-3">
            {/* Empty State - shown when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <CrackItIcon size={40} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {selectedText ? "Ready to Analyze" : "AI-Powered Insights"}
                </h3>
                {selectedText ? (
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Click <strong>"Analyze It"</strong> below to get AI-powered analysis with web search
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Select text from your workspace to analyze it with AI
                  </p>
                )}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white ml-8 p-3"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mr-0 p-3 space-y-3 shadow-sm"
                )}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    {/* Status Badge - shows real-time progress */}
                    {(msg.isSearching || msg.sources) && (
                      <div className="flex items-center gap-2 mb-3">
                        {msg.isSearching ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
                            <Globe className="h-3 w-3 animate-spin" />
                            Searching...
                          </div>
                        ) : msg.sources && msg.sources.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            {msg.sources.length} sources
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Search Query Badge */}
                    {msg.searchQuery && (
                      <div className="mb-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start gap-2 px-3 py-2">
                          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mt-0.5">
                            <Search className="h-3 w-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Search Query</p>
                            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 break-words leading-relaxed">
                              {msg.searchQuery}
                            </p>
                          </div>
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
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                              <Globe className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sources</span>
                            <span className="text-xs text-muted-foreground">({msg.sources.length})</span>
                          </div>
                        </div>

                        {/* Sources List - Compact */}
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                          {msg.sources.map((source, i) => {
                            const isExpanded = expandedSources.has(i)
                            const hostname = source.link.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

                            return (
                              <div key={i} className="bg-white dark:bg-slate-950">
                                {/* Source content */}
                                <div className="px-3 py-2">
                                  {/* Title row with number badge */}
                                  <div className="flex items-start gap-2 mb-1.5">
                                    <span className="flex-shrink-0 w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-semibold mt-0.5">
                                      {i + 1}
                                    </span>
                                    <h5 className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug flex-1">
                                      {source.title}
                                    </h5>
                                  </div>

                                  {/* Bottom row: link + summary button */}
                                  <div className="flex items-center justify-between gap-2 pl-7">
                                    <a
                                      href={source.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline min-w-0"
                                    >
                                      <span className="truncate">{source.media || hostname}</span>
                                      <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                                    </a>

                                    {/* Summary toggle button */}
                                    {source.content && source.content.length > 0 && (
                                      <button
                                        onClick={() => toggleSource(i)}
                                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                      >
                                        <span>{isExpanded ? "Hide" : "Show"} summary</span>
                                        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded && "rotate-180")} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Summary content */}
                                {isExpanded && source.content && source.content.length > 0 && (
                                  <div className="px-3 pb-2 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-2 whitespace-pre-wrap">
                                      {source.content}
                                    </p>
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
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Input Controls Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              {/* Web Search Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs font-medium transition-all gap-1",
                  useWebSearch
                    ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                )}
                onClick={() => setUseWebSearch(!useWebSearch)}
              >
                <Search className="h-3 w-3" />
                {useWebSearch ? "Web Search ON" : "Web Search OFF"}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {/* Clear Chat Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 gap-1"
                onClick={clearChat}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
              {/* Analyze It Selection */}
              {selectedText && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 px-3 text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 gap-1.5 shadow-md shadow-violet-500/20"
                  onClick={() => analyzeSelection()}
                  disabled={isLoading}
                >
                  <CrackItIcon size={14} />
                  Analyze It
                </Button>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div className="p-3">
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
                className="min-h-[44px] max-h-[120px] resize-none text-sm border-slate-300 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500"
                disabled={isLoading}
              />
              <Button
                onClick={() => analyzeSelection()}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-[44px] w-[44px] flex-shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
