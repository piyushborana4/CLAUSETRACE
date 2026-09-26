import jsPDF from 'jspdf';
import { LegalDocument, Finding } from '../types';

export interface EmailExportItem {
  finding: Finding;
  recipientRole: string;
  subject: string;
  body: string;
}

export interface PdfExportOptions {
  document: LegalDocument;
  items: EmailExportItem[];
  userName?: string;
  includeEvidenceQuotes?: boolean;
  includeTimelines?: boolean;
  includeDisclaimer?: boolean;
  customNotes?: string;
}

/**
 * Generates and downloads a beautifully styled, professional PDF document
 * containing selected findings, clause quotes, and drafted clarification messages.
 */
export function exportActionCenterPdf(options: PdfExportOptions): void {
  const {
    document: docData,
    items,
    userName = 'Document Reviewer',
    includeEvidenceQuotes = true,
    includeTimelines = true,
    includeDisclaimer = true,
    customNotes,
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 42;
  const marginTop = 48;
  const marginBottom = 48;
  const contentWidth = pageWidth - marginX * 2;

  let currentY = marginTop;
  let pageNum = 1;

  // Colors
  const primaryColor = [26, 115, 232]; // #1A73E8 Google Blue
  const darkColor = [31, 31, 31]; // #1F1F1F
  const grayColor = [95, 99, 104]; // #5F6368
  const lightGrayBg = [248, 249, 250]; // #F8F9FA
  const borderGray = [218, 220, 224]; // #DADCE0
  const blueLightBg = [232, 240, 254]; // #E8F0FE
  const blueBorder = [210, 227, 252]; // #D2E3FC
  const amberBg = [254, 247, 230]; // #FEF7E6
  const amberBorder = [254, 239, 195]; // #FEEFC3
  const amberText = [176, 96, 0]; // #B06000

  const addNewPageIfNeeded = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      drawFooter();
      pdf.addPage();
      pageNum++;
      currentY = marginTop;
      drawPageHeaderCompact();
    }
  };

  const drawPageHeaderCompact = () => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text('CLAUSETRACE  |  ACTION CENTER CLARIFICATION MEMO', marginX, 30);

    pdf.setFont('helvetica', 'normal');
    pdf.text(
      docData.title.length > 40 ? docData.title.slice(0, 38) + '...' : docData.title,
      pageWidth - marginX,
      30,
      { align: 'right' }
    );

    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(0.5);
    pdf.line(marginX, 35, pageWidth - marginX, 35);
  };

  const drawFooter = () => {
    const footerY = pageHeight - 25;
    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(0.5);
    pdf.line(marginX, footerY - 10, pageWidth - marginX, footerY - 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text('Generated with ClauseTrace · Non-argumentative clarification inquiries', marginX, footerY);
    pdf.text(`Page ${pageNum}`, pageWidth - marginX, footerY, { align: 'right' });
  };

  // ==========================================
  // 1. COVER / FIRST PAGE HEADER
  // ==========================================
  // Brand Pill
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.roundedRect(marginX, currentY, 82, 18, 3, 3, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('CLAUSETRACE', marginX + 10, currentY + 12);

  // Date Tag
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.text(`Exported: ${dateStr}`, pageWidth - marginX, currentY + 12, { align: 'right' });

  currentY += 28;

  // Document Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  const docTitleLines = pdf.splitTextToSize(
    `Clarification Requests: ${docData.title}`,
    contentWidth
  );
  pdf.text(docTitleLines, marginX, currentY);
  currentY += docTitleLines.length * 22 + 4;

  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const subtitle = `Structured list of ${items.length} prioritized finding${
    items.length > 1 ? 's' : ''
  } with exact contract clause references and prepared polite clarification emails.`;
  const subLines = pdf.splitTextToSize(subtitle, contentWidth);
  pdf.text(subLines, marginX, currentY);
  currentY += subLines.length * 14 + 10;

  // Metadata Card
  pdf.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  pdf.setLineWidth(0.75);
  pdf.roundedRect(marginX, currentY, contentWidth, 42, 6, 6, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.text('DOCUMENT TYPE', marginX + 12, currentY + 14);
  pdf.text('PAGES REVIEWED', marginX + 140, currentY + 14);
  pdf.text('INQUIRIES COMPILED', marginX + 260, currentY + 14);
  pdf.text('PREPARED BY', marginX + 380, currentY + 14);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  pdf.text(docData.documentType || 'Legal Agreement', marginX + 12, currentY + 28);
  pdf.text(`${docData.pageCount || 1} Pages`, marginX + 140, currentY + 28);
  pdf.text(`${items.length} Message${items.length > 1 ? 's' : ''}`, marginX + 260, currentY + 28);
  pdf.text(userName.slice(0, 22), marginX + 380, currentY + 28);

  currentY += 52;

  // ==========================================
  // Optional Key Timelines summary
  // ==========================================
  if (includeTimelines && (docData.keyTerms.noticePeriod || docData.keyTerms.probationPeriod || docData.keyTerms.bondOrLockIn)) {
    addNewPageIfNeeded(70);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    pdf.text('Key Timelines & Critical Commitments', marginX, currentY);
    currentY += 14;

    const timelineItems: { label: string; val: string }[] = [];
    if (docData.keyTerms.noticePeriod) {
      timelineItems.push({ label: 'Notice Requirement', val: docData.keyTerms.noticePeriod });
    }
    if (docData.keyTerms.probationPeriod) {
      timelineItems.push({ label: 'Review / Probation', val: docData.keyTerms.probationPeriod });
    }
    if (docData.keyTerms.bondOrLockIn) {
      timelineItems.push({ label: 'Lock-in / Bond', val: docData.keyTerms.bondOrLockIn });
    }
    if (docData.keyTerms.governingLaw) {
      timelineItems.push({ label: 'Governing Law', val: docData.keyTerms.governingLaw });
    }

    const boxCount = Math.min(timelineItems.length, 3);
    if (boxCount > 0) {
      const boxWidth = (contentWidth - (boxCount - 1) * 8) / boxCount;
      const boxHeight = 36;

      for (let i = 0; i < boxCount; i++) {
        const bx = marginX + i * (boxWidth + 8);
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        pdf.roundedRect(bx, currentY, boxWidth, boxHeight, 4, 4, 'FD');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        pdf.text(timelineItems[i].label, bx + 8, currentY + 12);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        const val = timelineItems[i].val;
        pdf.text(val.length > 25 ? val.slice(0, 23) + '...' : val, bx + 8, currentY + 26);
      }
      currentY += boxHeight + 16;
    }
  }

  // Optional Custom Note
  if (customNotes && customNotes.trim()) {
    addNewPageIfNeeded(60);
    pdf.setFillColor(amberBg[0], amberBg[1], amberBg[2]);
    pdf.setDrawColor(amberBorder[0], amberBorder[1], amberBorder[2]);
    pdf.roundedRect(marginX, currentY, contentWidth, 38, 4, 4, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(amberText[0], amberText[1], amberText[2]);
    pdf.text('CONSULTATION NOTE / REMINDER:', marginX + 10, currentY + 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const noteLines = pdf.splitTextToSize(customNotes.trim(), contentWidth - 20);
    pdf.text(noteLines[0] || '', marginX + 10, currentY + 26);
    currentY += 46;
  }

  // ==========================================
  // 2. SELECTED FINDINGS & DRAFTED EMAILS
  // ==========================================
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  pdf.text('Drafted Clarification Messages & Exact Citations', marginX, currentY);
  currentY += 16;

  items.forEach((item, index) => {
    const { finding, recipientRole, subject, body } = item;

    // Estimate box sizes to calculate if page break is needed
    const subjectLines = pdf.splitTextToSize(`Subject: ${subject}`, contentWidth - 24);
    const bodyLines = pdf.splitTextToSize(body, contentWidth - 24);
    const whyItMattersLines = pdf.splitTextToSize(
      `Why it matters: ${finding.why_it_matters || finding.summary}`,
      contentWidth - 24
    );

    let evidenceLines: string[] = [];
    if (includeEvidenceQuotes && finding.evidence) {
      evidenceLines = pdf.splitTextToSize(`"${finding.evidence}"`, contentWidth - 28);
    }

    const findingHeaderHeight = 32;
    const whyHeight = whyItMattersLines.length * 11 + 6;
    const evidenceHeight = evidenceLines.length > 0 ? evidenceLines.length * 10 + 20 : 0;
    const emailHeaderHeight = 22;
    const subjectHeight = subjectLines.length * 11 + 8;
    const bodyHeight = bodyLines.length * 11.5 + 16;
    const totalItemHeight =
      findingHeaderHeight + whyHeight + evidenceHeight + emailHeaderHeight + subjectHeight + bodyHeight + 24;

    // Check if we need a new page for this card
    addNewPageIfNeeded(Math.min(totalItemHeight, 220));

    const itemStartY = currentY;

    // Outer Container Box
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(0.75);

    // Header strip for this finding
    pdf.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
    pdf.roundedRect(marginX, currentY, contentWidth, 28, 4, 4, 'FD');

    // Finding Index & Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    pdf.text(`${index + 1}. ${finding.title}`, marginX + 10, currentY + 18);

    // Section & Page Pill
    const tagText = `Page ${finding.page || 1} · ${finding.section || 'General'}`;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(tagText, pageWidth - marginX - 10, currentY + 18, { align: 'right' });

    currentY += 34;

    // Why it matters
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.text(whyItMattersLines, marginX + 6, currentY);
    currentY += whyHeight + 4;

    // Exact Quote Box (if available)
    if (includeEvidenceQuotes && finding.evidence && evidenceLines.length > 0) {
      addNewPageIfNeeded(evidenceHeight + 20);

      const quoteBoxHeight = evidenceLines.length * 10 + 14;
      pdf.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
      pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(marginX + 6, currentY, contentWidth - 12, quoteBoxHeight, 3, 3, 'FD');

      // Small quote mark or tag
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('EXACT CONTRACT CLAUSE:', marginX + 14, currentY + 10);

      pdf.setFont('helvetica', 'oblique');
      pdf.setFontSize(8);
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      pdf.text(evidenceLines, marginX + 14, currentY + 20);

      currentY += quoteBoxHeight + 8;
    }

    // Email Draft Container (Blue-tinted card)
    addNewPageIfNeeded(subjectHeight + bodyHeight + 36);

    const emailBoxHeight = subjectHeight + bodyHeight + 24;
    pdf.setFillColor(blueLightBg[0], blueLightBg[1], blueLightBg[2]);
    pdf.setDrawColor(blueBorder[0], blueBorder[1], blueBorder[2]);
    pdf.setLineWidth(0.75);
    pdf.roundedRect(marginX + 6, currentY, contentWidth - 12, emailBoxHeight, 4, 4, 'FD');

    // Email Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text(`DRAFTED INQUIRY MESSAGE (TO: ${recipientRole.toUpperCase()})`, marginX + 14, currentY + 12);

    // Subject
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    pdf.text(subjectLines, marginX + 14, currentY + 24);

    // Body
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    pdf.text(bodyLines, marginX + 14, currentY + 24 + subjectHeight);

    currentY += emailBoxHeight + 16;
  });

  // ==========================================
  // 3. BEST PRACTICES & STANDARD DISCLAIMER
  // ==========================================
  if (includeDisclaimer) {
    addNewPageIfNeeded(90);

    pdf.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(marginX, currentY, contentWidth, 68, 4, 4, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('PROFESSIONAL COMMUNICATION PRINCIPLES', marginX + 10, currentY + 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    const guidelines = [
      '• Clarification inquiries are a standard part of commercial & employment review before executing agreements.',
      '• Written responses or side letters provided by the counterparty should be archived alongside the final contract.',
      '• Notice: This document is generated for informational preparation and communication drafting. It is not formal legal advice.',
    ];
    let gy = currentY + 25;
    guidelines.forEach((g) => {
      pdf.text(g, marginX + 10, gy);
      gy += 12;
    });

    currentY += 76;
  }

  // Draw footer on the final page
  drawFooter();

  // Clean filename
  const cleanTitle = (docData.title || 'Document')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  const fileName = `clausetrace-clarification-${cleanTitle}-${new Date().toISOString().slice(0, 10)}.pdf`;

  // Download
  pdf.save(fileName);
}
