"use client";

import { TrendingUp, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CaseStudy } from "@/types/innovation";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  onSelect: (study: CaseStudy) => void;
}

const BUSINESS_MODEL_LABELS: Record<string, string> = {
  marketplace: "Marketplace",
  saas: "SaaS",
  "on-demand": "On-Demand",
  subscription: "Subscription",
  freemium: "Freemium",
  "e-commerce": "E-Commerce",
};

const BUSINESS_MODEL_COLORS: Record<string, string> = {
  marketplace: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  saas: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  "on-demand": "bg-green-100 text-green-700 hover:bg-green-200",
  subscription: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  freemium: "bg-pink-100 text-pink-700 hover:bg-pink-200",
  "e-commerce": "bg-amber-100 text-amber-700 hover:bg-amber-200",
};

export function CaseStudyCard({ caseStudy, onSelect }: CaseStudyCardProps) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 overflow-hidden"
      onClick={() => onSelect(caseStudy)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base mb-0.5 group-hover:text-primary transition-colors">
              {caseStudy.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {caseStudy.tagline}
            </p>
          </div>
          {caseStudy.featured && (
            <TrendingUp className="h-4 w-4 text-amber-500 flex-shrink-0 ml-2" />
          )}
        </div>

        {/* Company & Year */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{caseStudy.company}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{caseStudy.yearFounded}</span>
        </div>

        {/* Business Model Badge */}
        <div className="mb-3">
          <Badge
            variant="outline"
            className={`text-xs ${BUSINESS_MODEL_COLORS[caseStudy.businessModel] || ""} border-0`}
          >
            {BUSINESS_MODEL_LABELS[caseStudy.businessModel] || caseStudy.businessModel}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-muted/50 rounded px-2 py-1.5">
            <div className="text-muted-foreground mb-0.5">ROI</div>
            <div className="font-medium text-foreground">{caseStudy.metrics.roi}</div>
          </div>
          <div className="bg-muted/50 rounded px-2 py-1.5">
            <div className="text-muted-foreground mb-0.5">Timeline</div>
            <div className="font-medium text-foreground">{caseStudy.metrics.timeframe}</div>
          </div>
        </div>

        {/* Tags */}
        {caseStudy.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {caseStudy.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {caseStudy.tags.length > 3 && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{caseStudy.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* View Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full group-hover:bg-primary/10 justify-between px-3"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(caseStudy);
          }}
        >
          <span className="text-xs">View Full Story</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
