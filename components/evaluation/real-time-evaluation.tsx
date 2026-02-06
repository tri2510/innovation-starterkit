import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, CheckCircle2 } from "lucide-react"
import { CrackItIcon } from "@/components/text-selection/crack-it-icon"
import { cn } from "@/lib/utils"

interface RealTimeEvaluationProps {
  overallProgress: number
  completedItems: number
  totalItems: number
  suggestions?: string[]
  className?: string
}

export function RealTimeEvaluation({
  overallProgress,
  completedItems,
  totalItems,
  suggestions = [],
  className = ""
}: RealTimeEvaluationProps) {
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-blue-500"
  }

  const getStatusColor = (score: number) => {
    if (score >= 80) return "text-green-700 dark:text-green-300"
    if (score >= 50) return "text-yellow-700 dark:text-yellow-300"
    return "text-blue-700 dark:text-blue-300"
  }

  const getStatusBg = (score: number) => {
    if (score >= 80) return "bg-green-50 dark:bg-green-900/20"
    if (score >= 50) return "bg-yellow-50 dark:bg-yellow-900/20"
    return "bg-blue-50 dark:bg-blue-900/20"
  }

  return (
    <Card className={cn("border-blue-200 dark:border-blue-800", className)}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-blue-100 dark:border-blue-900 pb-3">
          <CrackItIcon size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Cracky's Live Evaluation
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Real-time feedback as you work
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className={cn("p-3 rounded-lg border", getStatusBg(overallProgress))}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Challenge Quality Score
            </span>
            <span className={cn("text-2xl font-bold", getStatusColor(overallProgress))}>
              {overallProgress}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Progress Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">Completion</span>
            <span className={cn("font-semibold", getStatusColor(overallProgress))}>
              {completedItems} of {totalItems} sections
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalItems }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < completedItems ? getProgressColor(overallProgress) : "bg-neutral-200 dark:bg-neutral-700"
                )}
              />
            ))}
          </div>
        </div>

        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Cracky's Suggestions
              </span>
            </div>
            <div className="space-y-1.5">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-1.5 rounded border border-blue-200 dark:border-blue-800"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encouragement */}
        {overallProgress >= 80 && (
          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Excellent work! Ready for market analysis.</span>
          </div>
        )}
      </div>
    </Card>
  )
}
