import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users, Building, Building2, TrendingUp, BarChart3, AlertTriangle, DollarSign, Calculator, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { InvestmentProgressItem } from "@/lib/investment-utils";

interface BaseProgressCardProps {
  item: InvestmentProgressItem;
  isActive?: boolean;
}

// Helper function to get status styling for compact pill
function getStatusPillStyles(status: InvestmentProgressItem["status"]) {
  return cn(
    "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0",
    status === "complete" && "bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300",
    status === "gathering" && "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
    status === "awaiting_confirmation" && "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300",
    status === "waiting" && "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400"
  );
}

// Personnel Costs Progress Card (compact with value)
export function PersonnelCostsProgressCard({ item, isActive }: BaseProgressCardProps) {
  const Icon = item.icon || Users;
  return (
    <div className={cn("flex items-center justify-between gap-2 py-1", isActive && "ring-1 ring-blue-500 rounded-md px-1 -mx-1")}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className={cn(
          "h-3 w-3 flex-shrink-0",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-600 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-amber-600 dark:text-amber-400",
          item.status === "waiting" && "text-neutral-400"
        )} />
        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">{item.label}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {item.excerpt && item.status === "complete" ? (
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.excerpt}</span>
        ) : (
          <div className={getStatusPillStyles(item.status)}>
            {item.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {item.status === "gathering" && <Clock className="h-2.5 w-2.5 animate-spin" />}
            {item.status === "awaiting_confirmation" && <Clock className="h-2.5 w-2.5" />}
            {item.status === "waiting" && <Clock className="h-2.5 w-2.5 opacity-50" />}
            <span className="capitalize">{item.status === "awaiting_confirmation" ? "Review" : item.status === "waiting" ? "Pending" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Operating Expenses Progress Card (compact with value)
export function OperatingExpensesProgressCard({ item, isActive }: BaseProgressCardProps) {
  const Icon = item.icon || Building;
  return (
    <div className={cn("flex items-center justify-between gap-2 py-1", isActive && "ring-1 ring-blue-500 rounded-md px-1 -mx-1")}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className={cn(
          "h-3 w-3 flex-shrink-0",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-600 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-amber-600 dark:text-amber-400",
          item.status === "waiting" && "text-neutral-400"
        )} />
        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">{item.label}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {item.excerpt && item.status === "complete" ? (
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.excerpt}</span>
        ) : (
          <div className={getStatusPillStyles(item.status)}>
            {item.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {item.status === "gathering" && <Clock className="h-2.5 w-2.5 animate-spin" />}
            {item.status === "awaiting_confirmation" && <Clock className="h-2.5 w-2.5" />}
            {item.status === "waiting" && <Clock className="h-2.5 w-2.5 opacity-50" />}
            <span className="capitalize">{item.status === "awaiting_confirmation" ? "Review" : item.status === "waiting" ? "Pending" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Capital Investments Progress Card (compact with value)
export function CapitalInvestmentsProgressCard({ item, isActive }: BaseProgressCardProps) {
  const Icon = item.icon || Building2;
  return (
    <div className={cn("flex items-center justify-between gap-2 py-1", isActive && "ring-1 ring-blue-500 rounded-md px-1 -mx-1")}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className={cn(
          "h-3 w-3 flex-shrink-0",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-600 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-amber-600 dark:text-amber-400",
          item.status === "waiting" && "text-neutral-400"
        )} />
        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">{item.label}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {item.excerpt && item.status === "complete" ? (
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.excerpt}</span>
        ) : (
          <div className={getStatusPillStyles(item.status)}>
            {item.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {item.status === "gathering" && <Clock className="h-2.5 w-2.5 animate-spin" />}
            {item.status === "awaiting_confirmation" && <Clock className="h-2.5 w-2.5" />}
            {item.status === "waiting" && <Clock className="h-2.5 w-2.5 opacity-50" />}
            <span className="capitalize">{item.status === "awaiting_confirmation" ? "Review" : item.status === "waiting" ? "Pending" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Revenue Forecasts Progress Card (compact with value)
export function RevenueForecastsProgressCard({ item, isActive }: BaseProgressCardProps) {
  const Icon = item.icon || TrendingUp;
  return (
    <div className={cn("flex items-center justify-between gap-2 py-1", isActive && "ring-1 ring-blue-500 rounded-md px-1 -mx-1")}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className={cn(
          "h-3 w-3 flex-shrink-0",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-600 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-amber-600 dark:text-amber-400",
          item.status === "waiting" && "text-neutral-400"
        )} />
        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">{item.label}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {item.excerpt && item.status === "complete" ? (
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.excerpt}</span>
        ) : (
          <div className={getStatusPillStyles(item.status)}>
            {item.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {item.status === "gathering" && <Clock className="h-2.5 w-2.5 animate-spin" />}
            {item.status === "awaiting_confirmation" && <Clock className="h-2.5 w-2.5" />}
            {item.status === "waiting" && <Clock className="h-2.5 w-2.5 opacity-50" />}
            <span className="capitalize">{item.status === "awaiting_confirmation" ? "Review" : item.status === "waiting" ? "Pending" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Financial Analysis Progress Card (compact with value)
export function FinancialAnalysisProgressCard({ item, isActive }: BaseProgressCardProps) {
  const Icon = item.icon || BarChart3;
  return (
    <div className={cn("flex items-center justify-between gap-2 py-1", isActive && "ring-1 ring-blue-500 rounded-md px-1 -mx-1")}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Calculator className={cn(
          "h-3 w-3 flex-shrink-0",
          item.status === "complete" && "text-green-600 dark:text-green-400",
          item.status === "gathering" && "text-blue-600 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-amber-600 dark:text-amber-400",
          item.status === "waiting" && "text-neutral-400"
        )} />
        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">{item.label}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {item.excerpt && item.status === "complete" ? (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">{item.excerpt}</Badge>
        ) : (
          <div className={getStatusPillStyles(item.status)}>
            {item.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {item.status === "gathering" && <Clock className="h-2.5 w-2.5 animate-spin" />}
            {item.status === "awaiting_confirmation" && <Clock className="h-2.5 w-2.5" />}
            {item.status === "waiting" && <Clock className="h-2.5 w-2.5 opacity-50" />}
            <span className="capitalize">{item.status === "awaiting_confirmation" ? "Review" : item.status === "waiting" ? "Pending" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Risk Assessment Progress Card (compact with value)
export function RiskAssessmentProgressCard({ item, isActive }: BaseProgressCardProps) {
  const Icon = item.icon || AlertTriangle;
  const riskColor = item.excerpt === 'low' ? 'green' : item.excerpt === 'medium' ? 'amber' : 'red';
  return (
    <div className={cn("flex items-center justify-between gap-2 py-1", isActive && "ring-1 ring-blue-500 rounded-md px-1 -mx-1")}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className={cn(
          "h-3 w-3 flex-shrink-0",
          item.status === "complete" && riskColor === 'green' && "text-green-600 dark:text-green-400",
          item.status === "complete" && riskColor === 'amber' && "text-amber-600 dark:text-amber-400",
          item.status === "complete" && riskColor === 'red' && "text-red-600 dark:text-red-400",
          item.status === "gathering" && "text-blue-600 dark:text-blue-400",
          item.status === "awaiting_confirmation" && "text-amber-600 dark:text-amber-400",
          item.status === "waiting" && "text-neutral-400"
        )} />
        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">{item.label}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {item.excerpt && item.status === "complete" ? (
          <Badge variant={item.excerpt === 'low' ? 'default' : item.excerpt === 'medium' ? 'secondary' : 'destructive'} className="text-[10px] px-1.5 py-0 h-4">
            {item.excerpt.toUpperCase()}
          </Badge>
        ) : (
          <div className={getStatusPillStyles(item.status)}>
            {item.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {item.status === "gathering" && <Clock className="h-2.5 w-2.5 animate-spin" />}
            {item.status === "awaiting_confirmation" && <Clock className="h-2.5 w-2.5" />}
            {item.status === "waiting" && <Clock className="h-2.5 w-2.5 opacity-50" />}
            <span className="capitalize">{item.status === "awaiting_confirmation" ? "Review" : item.status === "waiting" ? "Pending" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Generic progress card that renders the appropriate card based on section ID
export function InvestmentProgressCard({ item, isActive }: BaseProgressCardProps) {
  const cardMap: Record<string, React.ComponentType<BaseProgressCardProps>> = {
    personnel_costs: PersonnelCostsProgressCard,
    operating_expenses: OperatingExpensesProgressCard,
    capital_investments: CapitalInvestmentsProgressCard,
    revenue_forecasts: RevenueForecastsProgressCard,
    financial_analysis: FinancialAnalysisProgressCard,
    risk_assessment: RiskAssessmentProgressCard,
  };

  const CardComponent = cardMap[item.id];
  if (!CardComponent) {
    return (
      <div className={cn("flex items-center justify-between gap-2 py-1")}>
        <div className="flex items-center gap-1.5">
          {item.icon && <item.icon className="h-3 w-3" />}
          <span className="text-[10px] font-medium">{item.label}</span>
        </div>
        <div className={getStatusPillStyles(item.status)}>
          <span className="capitalize">{item.status}</span>
        </div>
      </div>
    );
  }

  return <CardComponent item={item} isActive={isActive} />;
}
