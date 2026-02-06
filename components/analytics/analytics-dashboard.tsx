import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, Lightbulb, Target, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  totalIdeas: number
  activeUsers: number
  avgScore: number
  categoryBreakdown: { category: string; count: number; color: string }[]
}

export function AnalyticsDashboard({ className = "" }: { className?: string }) {
  // Mock data for UI demonstration
  const analytics: AnalyticsData = {
    totalIdeas: 147,
    activeUsers: 23,
    avgScore: 72,
    categoryBreakdown: [
      { category: "Healthcare", count: 34, color: "bg-red-500" },
      { category: "Technology", count: 28, color: "bg-blue-500" },
      { category: "Finance", count: 22, color: "bg-green-500" },
      { category: "Education", count: 18, color: "bg-yellow-500" },
      { category: "Retail", count: 15, color: "bg-purple-500" },
      { category: "Other", count: 30, color: "bg-gray-500" },
    ]
  }

  const maxCategoryCount = Math.max(...analytics.categoryBreakdown.map(c => c.count))

  return (
    <Card className={cn("border-blue-200 dark:border-blue-800", className)}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Innovation Analytics
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Track your innovation progress
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Mockup
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total Ideas */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.totalIdeas}
              </span>
            </div>
            <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
              Total Ideas
            </p>
          </div>

          {/* Active Users */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analytics.activeUsers}
              </span>
            </div>
            <p className="text-[10px] text-green-700 dark:text-green-300 font-medium">
              Active Users
            </p>
          </div>

          {/* Avg Score */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics.avgScore}%
              </span>
            </div>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
              Avg Score
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Ideas by Category
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+12%</span>
            </span>
          </div>
          <div className="space-y-1.5">
            {analytics.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {cat.category}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {cat.count} ideas
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", cat.color)}
                    style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trend */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Performance This Week
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">
              +23%
            </span>
            <span className="text-[10px] text-neutral-600 dark:text-neutral-400">
              vs last week
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
