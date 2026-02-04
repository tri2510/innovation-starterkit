/**
 * Market Analysis Display Component
 * Shows the completed market analysis in a read-only format
 */

"use client";

import { BarChart3, TrendingUp, Users, Zap, AlertTriangle, Edit2, Check, X, Target, Building2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketAnalysis, MarketTrend, Competitor } from "@/types/innovation";
import { extractMarketValue } from "@/lib/market-utils";

interface MarketAnalysisDisplayProps {
  challenge: { problem: string; targetAudience: string; currentSolutions: string; industry?: string; context?: string };
  marketAnalysis: MarketAnalysis;
  onEdit?: () => void;
}

export function MarketAnalysisDisplay({ challenge, marketAnalysis, onEdit }: MarketAnalysisDisplayProps) {
  const getMomentumIcon = (momentum: MarketTrend["momentum"]) => {
    switch (momentum) {
      case "rising": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining": return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      case "stable": return <div className="h-4 w-4 bg-blue-500 rounded-full" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Market Analysis Complete</h1>
                <p className="text-sm text-muted-foreground">Comprehensive market insights for your innovation</p>
              </div>
            </div>
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="outline"
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Analysis
              </Button>
            )}
          </div>
        </div>

        {/* Challenge Summary */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Your Challenge</h3>
                <p className="text-xs text-muted-foreground">Innovation context</p>
              </div>
            </div>
          </div>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-3 font-serif">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs uppercase tracking-wide">Problem:</span> {challenge.problem}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wide">Target:</span> {challenge.targetAudience}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Market Size */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Market Size</h3>
                  <p className="text-xs text-muted-foreground">Your addressable market opportunity</p>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 font-serif">
              {(() => {
                const tam = extractMarketValue(marketAnalysis.tam);
                return (
                  <div className="text-center p-4 rounded-md bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">TAM</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{tam.value}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1 font-medium leading-tight">Total Addressable Market</p>
                    {tam.description && tam.description !== marketAnalysis.tam && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1">{tam.description}</p>
                    )}
                  </div>
                );
              })()}
              {(() => {
                const sam = extractMarketValue(marketAnalysis.sam);
                return (
                  <div className="text-center p-4 rounded-md bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">SAM</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{sam.value}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1 font-medium leading-tight">Serviceable Addressable Market</p>
                    {sam.description && sam.description !== marketAnalysis.sam && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1">{sam.description}</p>
                    )}
                  </div>
                );
              })()}
              {(() => {
                const som = extractMarketValue(marketAnalysis.som);
                return (
                  <div className="text-center p-4 rounded-md bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 uppercase tracking-wide">SOM</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{som.value}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1 font-medium leading-tight">Serviceable Obtainable Market</p>
                    {som.description && som.description !== marketAnalysis.som && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1">{som.description}</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Market Trends */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Market Trends</h3>
                <p className="text-xs text-muted-foreground">Key trends shaping the industry</p>
              </div>
            </div>
          </div>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 font-serif">
              {marketAnalysis.trends?.map((trend, index) => (
                <div key={index} className="p-4 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{trend.name}</h4>
                    <div className="flex items-center gap-2">
                      {getMomentumIcon(trend.momentum)}
                      <Badge variant="outline" className={
                        trend.impact === "high" ? "border-red-200 text-red-700 dark:text-red-400" :
                        trend.impact === "medium" ? "border-yellow-200 text-yellow-700 dark:text-yellow-400" :
                        "border-gray-200 text-gray-700 dark:text-gray-400"
                      }>
                        {trend.impact} impact
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{trend.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Competitive Landscape</h3>
                <p className="text-xs text-muted-foreground">Key players in your market</p>
              </div>
            </div>
          </div>
          <CardContent>
            <div className="space-y-4 font-serif">
              {marketAnalysis.competitors?.map((competitor, index) => (
                <div key={index} className="p-5 rounded-md border bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">{competitor.name}</h4>
                    {competitor.marketShare && (
                      <Badge variant="outline" className="font-medium">{competitor.marketShare}</Badge>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {competitor.strengths?.map?.((strength, i) => (
                          <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        )) || <li className="text-sm text-neutral-500">No strengths data available</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                        <X className="h-3 w-3" /> Weaknesses
                      </p>
                      <ul className="space-y-1">
                        {competitor.weaknesses?.map?.((weakness, i) => (
                          <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{weakness}</span>
                          </li>
                        )) || <li className="text-sm text-neutral-500">No weaknesses data available</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Opportunities & Challenges */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Opportunities</h3>
                  <p className="text-xs text-muted-foreground">Growth areas</p>
                </div>
              </div>
            </div>
            <CardContent className="pt-6">
              <ul className="space-y-3 font-serif">
                {marketAnalysis.opportunities?.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <div className="h-6 w-6 rounded-md bg-emerald-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {marketAnalysis.challenges && marketAnalysis.challenges.length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Challenges</h3>
                    <p className="text-xs text-muted-foreground">Potential obstacles</p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <ul className="space-y-3 font-serif">
                  {marketAnalysis.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                      <div className="h-6 w-6 rounded-md bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}