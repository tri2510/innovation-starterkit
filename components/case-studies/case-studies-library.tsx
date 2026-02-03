"use client";

import { useState, useEffect } from "react";
import { Search, X, TrendingUp, Building2, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CaseStudyCard } from "./case-study-card";
import { CaseStudyWalkthrough } from "./case-study-walkthrough";
import { getCaseStudies, getFeaturedCaseStudies, filterCaseStudies, getRecommendedCaseStudies } from "@/lib/case-studies";
import type { CaseStudy, BusinessModelType } from "@/types/innovation";

interface CaseStudiesLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep?: string;
  currentIdea?: {
    industry?: string;
    businessModel?: string;
  };
}

const BUSINESS_MODELS: { value: BusinessModelType; label: string; icon: string }[] = [
  { value: "marketplace", label: "Marketplace", icon: "🔗" },
  { value: "saas", label: "SaaS", icon: "☁️" },
  { value: "on-demand", label: "On-Demand", icon: "⚡" },
  { value: "subscription", label: "Subscription", icon: "🔄" },
  { value: "freemium", label: "Freemium", icon: "🆓" },
  { value: "e-commerce", label: "E-Commerce", icon: "🛒" },
];

export function CaseStudiesLibrary({
  isOpen,
  onClose,
  currentStep,
  currentIdea,
}: CaseStudiesLibraryProps) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [filteredStudies, setFilteredStudies] = useState<CaseStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<BusinessModelType | "all">("all");
  const [showRecommended, setShowRecommended] = useState(true);
  const [recommendedStudies, setRecommendedStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load case studies on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [allStudies, featured] = await Promise.all([
        getCaseStudies(),
        getFeaturedCaseStudies(),
      ]);

      setCaseStudies(allStudies);

      // Load recommendations based on user's current idea
      if (currentIdea?.industry || currentIdea?.businessModel) {
        const recommended = await getRecommendedCaseStudies(
          currentIdea.industry,
          currentIdea.businessModel as BusinessModelType
        );
        setRecommendedStudies(recommended);
      }

      setFilteredStudies(featured);
      setIsLoading(false);
    }

    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentIdea]);

  // Filter when search or category changes
  useEffect(() => {
    async function applyFilters() {
      let results = caseStudies;

      // Apply business model filter
      if (selectedModel !== "all") {
        results = results.filter((s) => s.businessModel === selectedModel);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        results = results.filter(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.company.toLowerCase().includes(query) ||
            s.industry.toLowerCase().includes(query) ||
            s.tags.some((t) => t.toLowerCase().includes(query))
        );
      }

      setFilteredStudies(results);
    }

    applyFilters();
  }, [searchQuery, selectedModel, caseStudies]);

  const handleSelectStudy = (study: CaseStudy) => {
    setSelectedStudy(study);
  };

  const handleCloseWalkthrough = () => {
    setSelectedStudy(null);
  };

  return (
    <>
      {/* Library Dialog */}
      <Dialog open={isOpen && !selectedStudy} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Case Studies Library
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Learn from real-world success stories
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </DialogHeader>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b bg-muted/20">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, industry, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Business Model Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Button
                variant={selectedModel === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedModel("all")}
                className="flex-shrink-0"
              >
                All Models
              </Button>
              {BUSINESS_MODELS.map((model) => (
                <Button
                  key={model.value}
                  variant={selectedModel === model.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedModel(model.value)}
                  className="flex-shrink-0"
                >
                  <span className="mr-1">{model.icon}</span>
                  {model.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading case studies...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Recommended Section */}
                {!searchQuery &&
                  selectedModel === "all" &&
                  recommendedStudies.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-primary">
                          Recommended for You
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recommendedStudies.map((study) => (
                          <CaseStudyCard
                            key={study.id}
                            caseStudy={study}
                            onSelect={handleSelectStudy}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* All Case Studies */}
                <div>
                  {searchQuery || selectedModel !== "all" ? (
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">
                        {filteredStudies.length}{" "}
                        {filteredStudies.length === 1 ? "Result" : "Results"}
                      </h3>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">
                        All Case Studies
                      </h3>
                    </div>
                  )}

                  {filteredStudies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredStudies.map((study) => (
                        <CaseStudyCard
                          key={study.id}
                          caseStudy={study}
                          onSelect={handleSelectStudy}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No case studies found matching your criteria.
                      </p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedModel("all");
                        }}
                        className="mt-2"
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            Click on any case study to explore its full innovation journey through all 5 phases.
          </div>
        </DialogContent>
      </Dialog>

      {/* Walkthrough Dialog */}
      {selectedStudy && (
        <CaseStudyWalkthrough
          caseStudy={selectedStudy}
          onClose={handleCloseWalkthrough}
        />
      )}
    </>
  );
}
