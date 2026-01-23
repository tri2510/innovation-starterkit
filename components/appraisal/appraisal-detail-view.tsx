/**
 * Appraisal Detail View Component
 * Shows full content for a selected appraisal section
 * With back button to return to grid
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Briefcase, Award, DollarSign, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";
import type { AppraisalProgressItem } from "@/lib/appraisal-utils";
import type { BusinessIdea } from "@/types/innovation";

interface AppraisalDetailViewProps {
  section: AppraisalProgressItem;
  appraisalData: any; // Merged appraisal data
  selectedIdea: BusinessIdea | null;
  onBack: () => void;
}

export function AppraisalDetailView({ section, appraisalData, selectedIdea, onBack }: AppraisalDetailViewProps) {
  const renderSectionContent = () => {
    switch (section.id) {
      case "target_market":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {appraisalData?.targetMarket || selectedIdea?.targetMarket || "Gathering target market data..."}
              </p>
            </div>
          </div>
        );

      case "business_model":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase">Business Model</h4>
              <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {appraisalData?.businessModel || selectedIdea?.businessModel || "Gathering business model data..."}
                </p>
              </div>
            </div>
            {appraisalData?.revenueStreams && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase">Revenue Streams</h4>
                <div className="space-y-2">
                  {(appraisalData.revenueStreams || selectedIdea?.revenueStreams || []).map((stream: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{stream}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "competitive_advantage":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {appraisalData?.competitiveAdvantage || selectedIdea?.competitiveAdvantage || "Gathering competitive advantage data..."}
              </p>
            </div>
          </div>
        );

      case "investment_costs":
        return (
          <div className="space-y-4">
            {/* Investment Summary */}
            {appraisalData?.estimatedInvestment && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">Estimated Investment</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{appraisalData.estimatedInvestment}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            )}

            {/* Personnel Costs */}
            {appraisalData?.personnelCosts && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Personnel Costs
                </h4>
                <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Annual</span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {appraisalData.personnelCosts.totalAnnual || "N/A"}
                    </span>
                  </div>
                  {appraisalData.personnelCosts.team && (
                    <div className="flex flex-wrap gap-1.5">
                      {appraisalData.personnelCosts.team.slice(0, 6).map((member: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{member.role}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Operating Expenses */}
            {appraisalData?.operatingExpenses && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Operating Expenses
                </h4>
                <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Monthly Burn</span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {appraisalData.operatingExpenses.totalMonthly || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Capital Investments */}
            {appraisalData?.capitalInvestments && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Capital Investments
                </h4>
                <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Initial</span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {appraisalData.capitalInvestments.totalInitial || "N/A"}
                    </span>
                  </div>
                  {appraisalData.capitalInvestments.items && appraisalData.capitalInvestments.items.length > 0 && (
                    <div className="space-y-2">
                      {appraisalData.capitalInvestments.items.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-neutral-600 dark:text-neutral-400">{item.category}</span>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "revenue_forecasts":
        return (
          <div className="space-y-4">
            {appraisalData?.revenueForecasts ? (
              <div className="space-y-3">
                {["year1", "year2", "year3", "year4", "year5"].map((year) => {
                  const data = appraisalData.revenueForecasts[year as keyof typeof appraisalData.revenueForecasts];
                  if (!data) return null;
                  return (
                    <div key={year} className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100">{year.replace("year", "Year ")}</h5>
                        <Badge variant="outline" className="text-xs">
                          {data.growth || "—"} growth
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.projected}</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{data.assumptions || "Projected revenue"}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Revenue forecasts gathering...</p>
              </div>
            )}
          </div>
        );

      case "financial_metrics":
        return (
          <div className="space-y-4">
            {/* Key Metrics Grid */}
            {appraisalData?.financialAnalysis ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-400">ROI</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{appraisalData.financialAnalysis.roi || "—"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-400">NPV</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{appraisalData.financialAnalysis.npv || "—"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-400">IRR</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{appraisalData.financialAnalysis.irr || "—"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800">
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-400">Payback</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{appraisalData.financialAnalysis.paybackPeriod || "—"}</p>
                </div>
              </div>
            ) : null}

            {/* Scoring Metrics */}
            {selectedIdea?.metrics && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3 uppercase flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Scoring Metrics
                </h4>
                <div className="space-y-3">
                  {(selectedIdea.metrics as any).overallScore && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">Overall Score</span>
                        <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">{(selectedIdea.metrics as any).overallScore}/100</span>
                      </div>
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${(selectedIdea.metrics as any).overallScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(selectedIdea.metrics as any).problemClarity && (
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Problem Clarity</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {(selectedIdea.metrics as any).problemClarity.score}/100
                        </span>
                      </div>
                    </div>
                  )}

                  {(selectedIdea.metrics as any).marketSize && (
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Market Size</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {(selectedIdea.metrics as any).marketSize.score}/100
                        </span>
                      </div>
                    </div>
                  )}

                  {(selectedIdea.metrics as any).innovation && (
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Innovation</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {(selectedIdea.metrics as any).innovation.score}/100
                        </span>
                      </div>
                    </div>
                  )}

                  {(selectedIdea.metrics as any).financialViability && (
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Financial Viability</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {(selectedIdea.metrics as any).financialViability.score}/100
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "risk_assessment":
        return (
          <div className="space-y-4">
            {/* Risk Level Banner */}
            {appraisalData?.riskAssessment && (
              <div className={`p-4 rounded-lg border-2 ${
                appraisalData.riskAssessment.riskLevel === "low"
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : appraisalData.riskAssessment.riskLevel === "medium"
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Risk Level</p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Viability: {appraisalData.riskAssessment.viabilityScore || "N/A"}
                    </p>
                  </div>
                  <Badge variant={
                    appraisalData.riskAssessment.riskLevel === "low" ? "default" :
                    appraisalData.riskAssessment.riskLevel === "medium" ? "secondary" : "destructive"
                  }>
                    {appraisalData.riskAssessment.riskLevel?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}

            {/* Timeline */}
            {selectedIdea?.timeframe && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">Timeline to Market</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{selectedIdea.timeframe}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Risks */}
            {appraisalData?.riskAssessment?.keyRisks && (
              <div>
                <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Key Risks
                </h4>
                <div className="space-y-2">
                  {appraisalData.riskAssessment.keyRisks.map((risk: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                      <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                      <span className="text-sm text-red-900 dark:text-red-100">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mitigations */}
            {appraisalData?.riskAssessment?.mitigations && (
              <div>
                <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 uppercase flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  Mitigations
                </h4>
                <div className="space-y-2">
                  {appraisalData.riskAssessment.mitigations.map((mitigation: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                      <span className="text-sm text-green-900 dark:text-green-100">{mitigation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {appraisalData?.riskAssessment?.recommendation && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase">Investment Recommendation</h4>
                <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                  {appraisalData.riskAssessment.recommendation}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-8 rounded-lg border border-dashed text-center">
            <p className="text-sm text-neutral-500">Section content not available</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to overview
      </Button>

      {/* Section Card */}
      <Card className="border-2">
        <div className="px-5 py-4 border-b bg-purple-50 dark:bg-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <section.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{section.label}</h2>
              {section.status === "complete" && (
                <Badge variant="default" className="text-xs mt-1">Complete</Badge>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          {renderSectionContent()}
        </CardContent>
      </Card>
    </div>
  );
}
