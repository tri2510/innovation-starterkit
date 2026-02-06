import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ThumbsUp, Lightbulb, Rocket, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Reaction {
  id: string
  label: string
  icon: React.ReactNode
  count: number
  color: string
}

interface TextReactionsProps {
  onReact?: (reactionId: string) => void
  className?: string
}

export function TextReactions({ onReact, className = "" }: TextReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([
    { id: "helpful", label: "Helpful", icon: <ThumbsUp className="h-3 w-3" />, count: 12, color: "text-green-600 dark:text-green-400" },
    { id: "innovative", label: "Innovative", icon: <Lightbulb className="h-3 w-3" />, count: 8, color: "text-yellow-600 dark:text-yellow-400" },
    { id: "scalable", label: "Scalable", icon: <Rocket className="h-3 w-3" />, count: 5, color: "text-blue-600 dark:text-blue-400" },
    { id: "trending", label: "Trending", icon: <TrendingUp className="h-3 w-3" />, count: 3, color: "text-purple-600 dark:text-purple-400" },
  ])

  const handleReact = (reactionId: string) => {
    setReactions(prev =>
      prev.map(r =>
        r.id === reactionId
          ? { ...r, count: r.count + 1 }
          : r
      )
    )
    onReact?.(reactionId)
  }

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs font-medium",
            "text-neutral-600 dark:text-neutral-400",
            "hover:text-neutral-900 dark:hover:text-neutral-100",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
            className
          )}
        >
          <span className="flex items-center gap-1.5">
            {totalReactions} reactions
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 px-2 py-1">
            React to this idea
          </p>
          {reactions.map((reaction) => (
            <button
              key={reaction.id}
              onClick={() => handleReact(reaction.id)}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded-md",
                "text-xs font-medium transition-colors",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                "text-neutral-700 dark:text-neutral-300"
              )}
            >
              <span className="flex items-center gap-2">
                <span className={reaction.color}>{reaction.icon}</span>
                <span>{reaction.label}</span>
              </span>
              <span className="font-semibold">{reaction.count}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
