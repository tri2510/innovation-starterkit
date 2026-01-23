import { getSession } from "./session";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

// Professional color palette
const COLORS = {
  primary: [30, 58, 138],      // Dark blue - corporate professional
  secondary: [71, 85, 105],    // Slate gray - headings
  accent: [59, 130, 246],      // Bright blue - highlights
  success: [34, 197, 94],      // Green - positive metrics
  warning: [234, 179, 8],      // Amber - medium metrics
  danger: [239, 68, 68],       // Red - high risk/negative
  light: [248, 250, 252],      // Light background
  text: [30, 41, 59],          // Dark text
  muted: [100, 116, 139],      // Muted text
  border: [226, 232, 240],    // Light borders
};

/**
 * Generate a professional PDF with all innovation session data
 * Uses a simpler approach with autoTable for reliable page breaks
 */
export function exportSessionToPDF(): void {
  const session = getSession();
  if (!session) {
    alert("No session data to export. Please complete at least one step first.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;

  // Track Y position manually
  let yPos = margin;
  let currentPage = 1;

  // Page break function with generous margin
  const checkPageBreak = (minSpaceRequired: number = 50) => {
    if (yPos + minSpaceRequired > pageHeight - 50) {
      doc.addPage();
      currentPage++;
      yPos = margin;
      addPageHeader(currentPage);
    }
  };

  // Add page header
  const addPageHeader = (pageNum: number) => {
    yPos = margin;

    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Innovation Journey Report", margin, 10);

    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    doc.text(dateStr, pageWidth - margin, 10, { align: "right" });

    yPos = margin + 20;
  };

  // Safe text rendering that checks space before each line
  const safeAddText = (text: string, fontSize: number = 10, indent: number = 0) => {
    const lines = doc.splitTextToSize(text, contentWidth - indent - 10);
    const lineHeight = fontSize * 0.5;

    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");

    for (const line of lines) {
      checkPageBreak(20);
      doc.text(line, margin + indent, yPos);
      yPos += lineHeight;
    }

    yPos += 3;
  };

  // Add section header
  const addSectionHeader = (num: string, title: string, subtitle: string) => {
    checkPageBreak(50);

    // Number badge
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.roundedRect(margin, yPos, 12, 10, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(num, margin + 6, yPos + 6, { align: "center" });

    // Title
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.setFontSize(16);
    doc.text(title, margin + 16, yPos + 6);

    yPos += 14;

    // Subtitle
    if (subtitle) {
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(subtitle, margin, yPos);
      yPos += 5;
    }

    // Divider
    doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + 35, yPos);
    yPos += 12;
  };

  // Add subsection header
  const addSubsection = (title: string) => {
    checkPageBreak(30);

    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 5;

    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, margin + 25, yPos);
    yPos += 8;
  };

  // Add a labeled field
  const addField = (label: string, value: string) => {
    checkPageBreak(40);

    // Label
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase() + ":", margin, yPos);
    yPos += 5;

    // Value
    safeAddText(value, 10, 4);
    yPos += 4;
  };

  // ========== COVER PAGE ==========
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // White card
  const cardMargin = 25;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardMargin, cardMargin, pageWidth - 2 * cardMargin, pageHeight - 2 * cardMargin, 3, 3, "F");

  // Accent line
  doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.rect(cardMargin, cardMargin, pageWidth - 2 * cardMargin, 5, "F");

  // Title
  yPos = cardMargin + 40;
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("INNOVATION JOURNEY", pageWidth / 2, yPos, { align: "center" });

  yPos += 10;
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Strategic Innovation Report", pageWidth / 2, yPos, { align: "center" });

  // Date
  yPos += 25;
  const dateStr = new Date(session.startedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
  doc.setFontSize(11);
  doc.text(dateStr, pageWidth / 2, yPos, { align: "center" });

  // Footer
  yPos = pageHeight - cardMargin - 30;
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(pageWidth / 2 - 50, yPos, 100, 25, 2, 2, "F");

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Innovation Kit", pageWidth / 2, yPos + 10, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("innovation-kit.app", pageWidth / 2, yPos + 18, { align: "center" });

  // ========== EXECUTIVE SUMMARY ==========
  doc.addPage();
  currentPage = 2;
  addPageHeader(currentPage);

  checkPageBreak(30);

  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Status boxes
  const stats = [
    { label: "Challenge", value: session.challenge ? "✓" : "—" },
    { label: "Market", value: session.marketAnalysis ? "✓" : "—" },
    { label: "Ideas", value: session.ideas?.length ? session.ideas.length.toString() : "—" },
    { label: "Pitch", value: session.pitchDeck ? "✓" : "—" },
  ];

  const boxWidth = (pageWidth - 2 * margin) / 4 - 3;
  stats.forEach((stat, i) => {
    const xPos = margin + i * (boxWidth + 4);
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(xPos, yPos, boxWidth, 18, 1, 1, "F");

    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(stat.label, xPos + boxWidth / 2, yPos + 6, { align: "center" });

    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setFontSize(14);
    doc.text(stat.value, xPos + boxWidth / 2, yPos + 13, { align: "center" });
  });

  yPos += 28;

  // Core challenge
  if (session.challenge?.problem) {
    addSubsection("Core Challenge");
    safeAddText(session.challenge.problem, 10);
    yPos += 5;
  }

  // Selected solution
  if (session.selectedIdeaId && session.ideas) {
    const selected = session.ideas.find(i => i.id === session.selectedIdeaId);
    if (selected) {
      checkPageBreak(30);
      addSubsection("Selected Solution");

      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(selected.name, margin, yPos);
      yPos += 5;

      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(`"${selected.tagline}"`, margin, yPos);
      yPos += 10;
    }
  }

  // ========== CHALLENGE ==========
  if (session.challenge) {
    doc.addPage();
    currentPage++;
    addPageHeader(currentPage);

    addSectionHeader("1", "Challenge Definition", "Understanding the problem space");

    addField("Problem Statement", session.challenge.problem);
    addField("Target Audience", session.challenge.targetAudience);
    addField("Existing Solutions", session.challenge.currentSolutions);

    if (session.challenge.industry) addField("Industry", session.challenge.industry);
    if (session.challenge.context) addField("Additional Context", session.challenge.context);
  }

  // ========== MARKET ANALYSIS ==========
  if (session.marketAnalysis) {
    doc.addPage();
    currentPage++;
    addPageHeader(currentPage);

    addSectionHeader("2", "Market Analysis", "Understanding the market opportunity");

    // Market size table
    addSubsection("Market Size");

    autoTable(doc, {
      startY: yPos,
      head: [["", ""]],
      body: [
        ["TAM", session.marketAnalysis.tam],
        ["SAM", session.marketAnalysis.sam],
        ["SOM", session.marketAnalysis.som],
      ],
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineWidth: 0.2,
        lineColor: COLORS.border as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: "bold", fillColor: COLORS.light as [number, number, number] },
        1: { cellWidth: contentWidth - 25 },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Trends
    if (session.marketAnalysis.trends?.length) {
      addSubsection("Market Trends");

      session.marketAnalysis.trends.forEach((trend) => {
        checkPageBreak(30);

        // Name and badge
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(trend.name, margin, yPos);

        // Badge
        const badgeX = margin + contentWidth - 25;
        const badgeColor = trend.momentum === "rising" ? COLORS.success :
                          trend.momentum === "stable" ? COLORS.warning : COLORS.danger;
        doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
        doc.roundedRect(badgeX, yPos - 3, 22, 5, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(trend.momentum.toUpperCase(), badgeX + 11, yPos, { align: "center" });

        yPos += 7;
        safeAddText(trend.description, 9);
        yPos += 5;
      });
    }

    // Competitors
    if (session.marketAnalysis.competitors?.length) {
      doc.addPage();
      currentPage++;
      addPageHeader(currentPage);
      addSubsection("Competitive Landscape");

      session.marketAnalysis.competitors.forEach((comp, i) => {
        checkPageBreak(50);

        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${i + 1}. ${comp.name}`, margin, yPos);
        if (comp.marketShare) {
          doc.setFontSize(8);
          doc.text(comp.marketShare, pageWidth - margin, yPos, { align: "right" });
        }
        yPos += 7;

        // Strengths
        doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Strengths:", margin + 2, yPos);
        yPos += 4;
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.setFont("helvetica", "normal");
        comp.strengths.slice(0, 3).forEach(s => {
          checkPageBreak(15);
          doc.text(`• ${s}`, margin + 6, yPos);
          yPos += 4;
        });

        yPos += 5;

        // Weaknesses
        doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Weaknesses:", margin + 2, yPos);
        yPos += 4;
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.setFont("helvetica", "normal");
        comp.weaknesses.slice(0, 3).forEach(w => {
          checkPageBreak(15);
          doc.text(`• ${w}`, margin + 6, yPos);
          yPos += 4;
        });

        yPos += 10;
      });
    }

    // Opportunities & Challenges
    if (session.marketAnalysis.opportunities?.length || session.marketAnalysis.challenges?.length) {
      doc.addPage();
      currentPage++;
      addPageHeader(currentPage);

      addSectionHeader("2.5", "Market Analysis Summary", "Key insights and implications");

      if (session.marketAnalysis.opportunities?.length) {
        addSubsection("Market Opportunities");

        session.marketAnalysis.opportunities.forEach((opp, i) => {
          checkPageBreak(30);
          doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          safeAddText(`${i + 1}. ${opp}`, 10, 2);
        });
      }

      if (session.marketAnalysis.challenges?.length) {
        checkPageBreak(50);
        addSubsection("Market Challenges");

        session.marketAnalysis.challenges.forEach((chal, i) => {
          checkPageBreak(30);
          doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          safeAddText(`${i + 1}. ${chal}`, 10, 2);
        });
      }
    }
  }

  // ========== BUSINESS IDEAS ==========
  if (session.ideas?.length) {
    doc.addPage();
    currentPage++;
    addPageHeader(currentPage);

    addSectionHeader("3", "Business Ideas", `${session.ideas.length} concepts generated`);

    session.ideas.forEach((idea, i) => {
      checkPageBreak(60);

      const isSelected = idea.id === session.selectedIdeaId;

      // Header
      if (isSelected) {
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.roundedRect(margin, yPos, contentWidth, 9, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
        doc.roundedRect(margin, yPos, contentWidth, 9, 1, 1, "F");
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${isSelected ? "★ " : ""}${i + 1}. ${idea.name}`, margin + 3, yPos + 6);
      yPos += 13;

      // Tagline
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`"${idea.tagline}"`, margin, yPos);
      yPos += 7;

      // Metrics bar
      const metrics = idea.metrics as any;
      const score = metrics?.overallScore || metrics?.marketFit || "N/A";
      const scoreColor = typeof score === "number" && score >= 80 ? COLORS.success :
                       typeof score === "number" && score >= 60 ? COLORS.warning : COLORS.muted;

      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.rect(margin, yPos, contentWidth, 6, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text("SCORE:", margin + 3, yPos + 4);
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${typeof score === "number" ? score + "/100" : score}`, margin + 14, yPos + 4);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text("ROI:", margin + 35, yPos + 4);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text((metrics?.roi || "N/A").toUpperCase(), margin + 42, yPos + 4);

      yPos += 11;

      // Content
      safeAddText(idea.description, 9);
      safeAddText(`Problem: ${idea.problemSolved}`, 9);
      safeAddText(`Market: ${idea.targetMarket || "TBD"}`, 9);

      // Revenue
      if (idea.revenueStreams && idea.revenueStreams.length > 0) {
        doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Revenue:", margin, yPos);
        yPos += 4;
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.setFont("helvetica", "normal");
        idea.revenueStreams.forEach(r => {
          checkPageBreak(10);
          doc.text(`• ${r}`, margin + 3, yPos);
          yPos += 4;
        });
      }

      yPos += 10;
    });
  }

  // ========== PITCH DECK ==========
  if (session.pitchDeck) {
    doc.addPage();
    currentPage++;
    addPageHeader(currentPage);

    addSectionHeader("4", "Pitch Deck", `${session.pitchDeck.slides.length} slides`);

    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`"${session.pitchDeck.title}"`, margin, yPos);
    yPos += 5;
    doc.text(session.pitchDeck.tagline, margin, yPos);
    yPos += 12;

    // Slides table
    const slidesData = session.pitchDeck.slides.map((s, i) => [
      `${i + 1}`,
      s.type.charAt(0).toUpperCase() + s.type.slice(1),
      s.title.substring(0, 50) + (s.title.length > 50 ? "..." : ""),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Type", "Title"]],
      body: slidesData,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary as [number, number, number],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineWidth: 0.2,
        lineColor: COLORS.border as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: contentWidth - 38 },
      },
      alternateRowStyles: { fillColor: COLORS.light as [number, number, number] },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Slide details
    session.pitchDeck.slides.forEach((slide, i) => {
      checkPageBreak(40);

      doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      doc.rect(margin, yPos, contentWidth, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`Slide ${i + 1}: ${slide.title}`, margin + 2, yPos + 4);
      yPos += 10;

      Object.entries(slide.content).forEach(([key, value]) => {
        const displayKey = key.replace(/([A-Z])/g, " $1").trim();
        const formattedKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);

        doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(formattedKey + ":", margin, yPos);
        yPos += 4;

        const displayValue = Array.isArray(value) ? value.join("; ") : String(value);
        safeAddText(displayValue, 7);
      });

      yPos += 5;
    });
  }

  // ========== CLOSING ==========
  doc.addPage();
  currentPage++;
  addPageHeader(currentPage);

  yPos = 60;
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Thank You", pageWidth / 2, yPos, { align: "center" });

  yPos += 30;
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(pageWidth / 2 - 50, yPos, 100, 30, 2, 2, "F");

  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setFontSize(8);
  doc.text("Generated by", pageWidth / 2, yPos + 10, { align: "center" });
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Innovation Kit", pageWidth / 2, yPos + 18, { align: "center" });
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("innovation-kit.app", pageWidth / 2, yPos + 25, { align: "center" });

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  // Save
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  doc.save(`innovation-journey-${timestamp}.pdf`);
}
