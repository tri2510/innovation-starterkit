import { getSession } from "./session";
import type { InnovationSession } from "@/types/innovation";

/**
 * Convert session data to Markdown format for export
 */
export function sessionToMarkdown(session: InnovationSession): string {
  const lines: string[] = [];
  const date = new Date(session.startedAt).toLocaleDateString();
  const time = new Date(session.startedAt).toLocaleTimeString();

  lines.push(`# Innovation Journey`);
  lines.push(``);
  lines.push(`**Created:** ${date} at ${time}`);
  lines.push(`**Last Updated:** ${new Date(session.updatedAt).toLocaleString()}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Challenge Section
  if (session.challenge) {
    lines.push(`## 1. Challenge Definition`);
    lines.push(``);
    lines.push(`### Problem`);
    lines.push(`${session.challenge.problem}`);
    lines.push(``);
    lines.push(`### Target Audience`);
    lines.push(`${session.challenge.targetAudience}`);
    lines.push(``);
    lines.push(`### Existing Solutions`);
    lines.push(`${session.challenge.currentSolutions}`);
    lines.push(``);
    if (session.challenge.industry) {
      lines.push(`### Industry`);
      lines.push(`${session.challenge.industry}`);
      lines.push(``);
    }
    if (session.challenge.context) {
      lines.push(`### Additional Context`);
      lines.push(`${session.challenge.context}`);
      lines.push(``);
    }
    lines.push(`---`);
    lines.push(``);
  }

  // Market Analysis Section
  if (session.marketAnalysis) {
    lines.push(`## 2. Market Analysis`);
    lines.push(``);
    lines.push(`### Market Size`);
    lines.push(``);
    lines.push(`- **TAM** (Total Addressable Market): ${session.marketAnalysis.tam}`);
    lines.push(`- **SAM** (Serviceable Addressable Market): ${session.marketAnalysis.sam}`);
    lines.push(`- **SOM** (Serviceable Obtainable Market): ${session.marketAnalysis.som}`);
    lines.push(``);

    if (session.marketAnalysis.trends && session.marketAnalysis.trends.length > 0) {
      lines.push(`### Market Trends`);
      lines.push(``);
      session.marketAnalysis.trends.forEach((trend) => {
        lines.push(`- **${trend.name}** (${trend.momentum}): ${trend.description}`);
        lines.push(`  - *Impact: ${trend.impact}*`);
      });
      lines.push(``);
    }

    if (session.marketAnalysis.competitors && session.marketAnalysis.competitors.length > 0) {
      lines.push(`### Key Competitors`);
      lines.push(``);
      session.marketAnalysis.competitors.forEach((competitor) => {
        lines.push(`#### ${competitor.name}`);
        lines.push(``);
        lines.push(`**Strengths:**`);
        competitor.strengths.forEach((s) => lines.push(`- ${s}`));
        lines.push(``);
        lines.push(`**Weaknesses:**`);
        competitor.weaknesses.forEach((w) => lines.push(`- ${w}`));
        if (competitor.marketShare) {
          lines.push(``);
          lines.push(`*Market Share: ${competitor.marketShare}*`);
        }
        lines.push(``);
      });
    }

    if (session.marketAnalysis.opportunities && session.marketAnalysis.opportunities.length > 0) {
      lines.push(`### Opportunities`);
      lines.push(``);
      session.marketAnalysis.opportunities.forEach((opp) => lines.push(`- ${opp}`));
      lines.push(``);
    }

    if (session.marketAnalysis.challenges && session.marketAnalysis.challenges.length > 0) {
      lines.push(`### Challenges`);
      lines.push(``);
      session.marketAnalysis.challenges.forEach((chal) => lines.push(`- ${chal}`));
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(``);
  }

  // Business Ideas Section
  if (session.ideas && session.ideas.length > 0) {
    lines.push(`## 3. Business Ideas`);
    lines.push(``);

    session.ideas.forEach((idea, index) => {
      const isSelected = idea.id === session.selectedIdeaId;
      const prefix = isSelected ? `★ **[SELECTED]**` : `${index + 1}.`;

      lines.push(`### ${prefix} ${idea.name}`);
      lines.push(``);
      lines.push(`*"${idea.tagline}"*`);
      lines.push(``);

      lines.push(`**Description:** ${idea.description}`);
      lines.push(``);
      lines.push(`**Problem Solved:** ${idea.problemSolved}`);
      lines.push(``);
      lines.push(`**Target Market:** ${idea.targetMarket}`);
      lines.push(``);

      // Metrics display
      if (idea.metrics) {
        const hasDetailed = "overallScore" in idea.metrics;

        if (hasDetailed) {
          const metrics = idea.metrics as any;
          lines.push(`**Metrics:**`);
          lines.push(``);
          lines.push(`| Criterion | Score |`);
          lines.push(`|-----------|-------|`);
          if (metrics.problemClarity) {
            lines.push(`| Problem Clarity (${(metrics.problemClarity.weight * 100).toFixed(0)}%) | ${metrics.problemClarity.score}/100 |`);
          }
          if (metrics.marketSize) {
            lines.push(`| Market Size (${(metrics.marketSize.weight * 100).toFixed(0)}%) | ${metrics.marketSize.score}/100 |`);
          }
          if (metrics.innovation) {
            lines.push(`| Innovation (${(metrics.innovation.weight * 100).toFixed(0)}%) | ${metrics.innovation.score}/100 |`);
          }
          if (metrics.financialViability) {
            lines.push(`| Financial Viability (${(metrics.financialViability.weight * 100).toFixed(0)}%) | ${metrics.financialViability.score}/100 |`);
          }
          if (metrics.strategicFit) {
            lines.push(`| Strategic Fit (${(metrics.strategicFit.weight * 100).toFixed(0)}%) | ${metrics.strategicFit.score}/100 |`);
          }
          if (metrics.marketFit) {
            lines.push(`| Market Fit (${(metrics.marketFit.weight * 100).toFixed(0)}%) | ${metrics.marketFit.score}/100 |`);
          }
          lines.push(`| **Overall** | **${metrics.overallScore}/100** |`);
          lines.push(``);
          lines.push(`**ROI:** ${metrics.roi?.toUpperCase()} | **Risk:** ${metrics.risk?.toUpperCase()}`);
        } else {
          const metrics = idea.metrics as any;
          lines.push(`**Metrics:**`);
          lines.push(``);
          lines.push(`- Market Fit: ${metrics.marketFit}/100`);
          lines.push(`- Feasibility: ${metrics.feasibility}/100`);
          lines.push(`- Innovation: ${metrics.innovation}/100`);
          lines.push(`- ROI: ${metrics.roi?.toUpperCase()}`);
          lines.push(`- Risk: ${metrics.risk?.toUpperCase()}`);
        }
        lines.push(``);
      }

      if (idea.businessModel) {
        lines.push(`**Business Model:** ${idea.businessModel}`);
        lines.push(``);
      }
      if (idea.revenueStreams && idea.revenueStreams.length > 0) {
        lines.push(`**Revenue Streams:**`);
        idea.revenueStreams.forEach((stream) => lines.push(`- ${stream}`));
        lines.push(``);
      }
      if (idea.competitiveAdvantage) {
        lines.push(`**Competitive Advantage:** ${idea.competitiveAdvantage}`);
        lines.push(``);
      }
      if (idea.estimatedInvestment) {
        lines.push(`**Estimated Investment:** ${idea.estimatedInvestment}`);
        lines.push(``);
      }
      if (idea.timeframe) {
        lines.push(`**Time to Market:** ${idea.timeframe}`);
        lines.push(``);
      }

      lines.push(`---`);
      lines.push(``);
    });
  }

  // Selected Idea Details
  if (session.selectedIdeaId && session.ideas) {
    const selectedIdea = session.ideas.find((i) => i.id === session.selectedIdeaId);
    if (selectedIdea) {
      lines.push(`## 4. Selected Innovation Plan`);
      lines.push(``);
      lines.push(`**"${selectedIdea.name}"** - ${selectedIdea.tagline}`);
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }
  }

  // Pitch Deck Section
  if (session.pitchDeck) {
    lines.push(`## 5. Pitch Deck`);
    lines.push(``);
    lines.push(`**Title:** ${session.pitchDeck.title}`);
    lines.push(``);
    lines.push(`**Tagline:** ${session.pitchDeck.tagline}`);
    lines.push(``);

    if (session.pitchDeck.slides && session.pitchDeck.slides.length > 0) {
      lines.push(`### Slides Overview`);
      lines.push(``);
      session.pitchDeck.slides.forEach((slide) => {
        lines.push(`#### ${slide.title}`);
        lines.push(`- *Type:* ${slide.type}`);
        const content = slide.content;
        if (content.tagline) lines.push(`- *Tagline:* ${content.tagline}`);
        if (content.problem) lines.push(`- *Problem:* ${content.problem}`);
        if (content.solution) lines.push(`- *Solution:* ${content.solution}`);
        if (content.tam) lines.push(`- *TAM:* ${content.tam}`);
        if (content.sam) lines.push(`- *SAM:* ${content.sam}`);
        if (content.som) lines.push(`- *SOM:* ${content.som}`);
        if (content.growth) lines.push(`- *Growth:* ${content.growth}`);
        if (content.model) lines.push(`- *Business Model:* ${content.model}`);
        if (content.revenueStreams) {
          const streams = Array.isArray(content.revenueStreams) ? content.revenueStreams.join(", ") : content.revenueStreams;
          lines.push(`- *Revenue Streams:* ${streams}`);
        }
        if (content.pricing) lines.push(`- *Pricing:* ${content.pricing}`);
        if (content.advantage) lines.push(`- *Advantage:* ${content.advantage}`);
        if (content.differentiators) {
          const diffs = Array.isArray(content.differentiators) ? content.differentiators.join(", ") : content.differentiators;
          lines.push(`- *Differentiators:* ${diffs}`);
        }
        if (content.funding) lines.push(`- *Funding:* ${content.funding}`);
        if (content.useOfFunds) {
          const funds = Array.isArray(content.useOfFunds) ? content.useOfFunds.join(", ") : content.useOfFunds;
          lines.push(`- *Use of Funds:* ${funds}`);
        }
        if (content.milestones) {
          const milestones = Array.isArray(content.milestones) ? content.milestones.join(", ") : content.milestones;
          lines.push(`- *Milestones:* ${milestones}`);
        }
        if (content.presenter) lines.push(`- *Presenter:* ${content.presenter}`);
        lines.push(``);
      });
    }

    lines.push(`---`);
    lines.push(``);
  }

  // Crack It Conversations Section
  if (session.crackItConversationHistory && session.crackItConversationHistory.length > 0) {
    lines.push(`## 6. Crack It Conversations`);
    lines.push(``);
    lines.push(`*AI-powered insights and research discussions throughout your journey*`);
    lines.push(``);

    session.crackItConversationHistory.forEach((msg, index) => {
      const role = msg.role === "user" ? "**You:**" : "**AI:**";
      const timestamp = new Date(msg.timestamp).toLocaleString();

      lines.push(`### [${index + 1}] ${role} (${timestamp})`);
      lines.push(``);

      // Show search query if available
      if (msg.searchQuery) {
        lines.push(`*🔍 Search Query:* "${msg.searchQuery}"`);
        lines.push(``);
      }

      // Show thinking if available
      if (msg.thinking) {
        lines.push(`**🧠 Thinking Process:**`);
        lines.push(``);
        lines.push(msg.thinking);
        lines.push(``);
      }

      // Show main content
      if (msg.content) {
        lines.push(msg.content);
        lines.push(``);
      }

      // Show sources if available
      if (msg.sources && msg.sources.length > 0) {
        lines.push(`**📚 Sources:**`);
        lines.push(``);
        msg.sources.forEach((source) => {
          lines.push(`- [${source.refer}] [${source.title}](${source.link})`);
          if (source.media) {
            lines.push(`  - *Source:* ${source.media}`);
          }
        });
        lines.push(``);
      }

      lines.push(`---`);
      lines.push(``);
    });
  }

  // Footer
  lines.push(`---`);
  lines.push(``);
  lines.push(`*Generated by Innovation Kit*`);
  lines.push(`*https://innovation-kit.app*`);

  return lines.join("\n");
}

/**
 * Trigger download of session as markdown file
 */
export function exportSessionToMarkdown(): void {
  const session = getSession();
  if (!session) {
    alert("No session data to export. Please complete at least one step first.");
    return;
  }

  const markdown = sessionToMarkdown(session);

  // Create blob and download
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);

  link.href = url;
  link.download = `innovation-journey-${timestamp}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
