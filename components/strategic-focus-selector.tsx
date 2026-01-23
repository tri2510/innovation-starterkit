"use client";

import { useState } from "react";
import { Building2, Cpu, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Industry, Technology, SearchFieldAssignment } from "@/types/innovation";

interface StrategicFocusSelectorProps {
  initialSelection?: SearchFieldAssignment;
  onSave: (selection: SearchFieldAssignment) => void;
  onCancel: () => void;
}

// Industry definitions with labels and colors
const INDUSTRIES: { id: Industry; label: string; color: string }[] = [
  { id: "manufacturing", label: "Manufacturing", color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" },
  { id: "healthcare", label: "Healthcare", color: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" },
  { id: "automotive", label: "Automotive", color: "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200" },
  { id: "agriculture", label: "Agriculture", color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
];

// Technology definitions with labels and colors
const TECHNOLOGIES: { id: Technology; label: string; color: string }[] = [
  { id: "ai-edge", label: "AI & Edge AI", color: "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200" },
  { id: "sdv", label: "Software-Defined Vehicle", color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-200" },
  { id: "robotics", label: "Robotics", color: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200" },
  { id: "virtualization", label: "Virtualization", color: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200" },
  { id: "cloud", label: "Cloud Computing", color: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200" },
];

export function StrategicFocusSelector({
  initialSelection,
  onSave,
  onCancel,
}: StrategicFocusSelectorProps) {
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>(
    initialSelection?.industries || []
  );
  const [selectedTechnologies, setSelectedTechnologies] = useState<Technology[]>(
    initialSelection?.technologies || []
  );

  const toggleIndustry = (industry: Industry) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  };

  const toggleTechnology = (technology: Technology) => {
    setSelectedTechnologies((prev) =>
      prev.includes(technology)
        ? prev.filter((t) => t !== technology)
        : [...prev, technology]
    );
  };

  const handleSave = () => {
    if (selectedIndustries.length === 0 && selectedTechnologies.length === 0) {
      // Allow empty selection - it's optional
    }

    const selection: SearchFieldAssignment = {
      industries: selectedIndustries,
      technologies: selectedTechnologies,
      reasoning: initialSelection?.reasoning || "",
    };

    onSave(selection);
  };

  const hasSelection = selectedIndustries.length > 0 || selectedTechnologies.length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Strategic Focus Areas</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Select the industries and technology areas that align with your innovation.
          This helps guide the ideation process toward strategic priorities.
        </p>
      </div>

      {/* Industry Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Industries</h4>
          <span className="text-xs text-muted-foreground">(Optional)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((industry) => {
            const isSelected = selectedIndustries.includes(industry.id);
            return (
              <button
                key={industry.id}
                onClick={() => toggleIndustry(industry.id)}
                className={`
                  inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium
                  transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isSelected ? industry.color : "bg-white text-muted-foreground border-neutral-200 hover:bg-neutral-50 hover:text-foreground"}
                `}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {industry.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Technology Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Technologies</h4>
          <span className="text-xs text-muted-foreground">(Optional)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TECHNOLOGIES.map((technology) => {
            const isSelected = selectedTechnologies.includes(technology.id);
            return (
              <button
                key={technology.id}
                onClick={() => toggleTechnology(technology.id)}
                className={`
                  inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium
                  transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isSelected ? technology.color : "bg-white text-muted-foreground border-neutral-200 hover:bg-neutral-50 hover:text-foreground"}
                `}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {technology.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection Summary */}
      {hasSelection && (
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">Your Selection:</p>
          <div className="flex flex-wrap gap-2">
            {selectedIndustries.map((industry) => {
              const info = INDUSTRIES.find((i) => i.id === industry);
              return (
                <Badge key={industry} variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {info?.label}
                </Badge>
              );
            })}
            {selectedTechnologies.map((technology) => {
              const info = TECHNOLOGIES.find((t) => t.id === technology);
              return (
                <Badge key={technology} variant="secondary" className="gap-1">
                  <Cpu className="h-3 w-3" />
                  {info?.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="gap-1.5">
          Save Selection
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Compact view for display in progress card
export function StrategicFocusDisplay({ selection }: { selection: SearchFieldAssignment }) {
  const hasIndustries = selection.industries.length > 0;
  const hasTechnologies = selection.technologies.length > 0;

  if (!hasIndustries && !hasTechnologies) {
    return (
      <p className="text-sm text-muted-foreground italic">No strategic focus selected</p>
    );
  }

  return (
    <div className="space-y-2">
      {hasIndustries && (
        <div className="flex flex-wrap gap-1.5">
          {selection.industries.map((industry) => {
            const info = INDUSTRIES.find((i) => i.id === industry);
            return (
              <Badge key={industry} variant="secondary" className="gap-1">
                <Building2 className="h-3 w-3" />
                {info?.label}
              </Badge>
            );
          })}
        </div>
      )}
      {hasTechnologies && (
        <div className="flex flex-wrap gap-1.5">
          {selection.technologies.map((technology) => {
            const info = TECHNOLOGIES.find((t) => t.id === technology);
            return (
              <Badge key={technology} variant="secondary" className="gap-1">
                <Cpu className="h-3 w-3" />
                {info?.label}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
