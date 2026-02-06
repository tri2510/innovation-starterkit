import { Badge } from "@/components/ui/badge"
import { CrackItIcon } from "@/components/text-selection/crack-it-icon"

interface CrackyBadgeProps {
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CrackyBadge({ showLabel = true, size = "md", className = "" }: CrackyBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  const textSizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm"
  }

  return (
    <Badge
      variant="secondary"
      className={`gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800 ${className}`}
    >
      <CrackItIcon size={size === "sm" ? 12 : size === "md" ? 16 : 20} className={sizeClasses[size]} />
      {showLabel && (
        <span className={`font-medium ${textSizeClasses[size]}`}>
          Assisted by Cracky
        </span>
      )}
    </Badge>
  )
}
