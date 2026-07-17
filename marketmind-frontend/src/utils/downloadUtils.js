// Download utility - generates professional PDF reports using jsPDF
// Usage: import { downloadPitchPDF, downloadAnalysisPDF, downloadFullReport } from './downloadUtils'

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function downloadTXT(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPitchPDF(pitch, idea) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const ICONS = { Problem: '🔥', Solution: '💡', 'Market Size': '📊', 'Product Demo': '🛠️', 'Business Model': '💰', Traction: '📈', Competition: '🥊', Team: '👥', Financials: '📋', 'The Ask': '🤝' };

  // Cover slide
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, H - 8, W, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(pitch.pitchTitle || idea.product, W / 2, H / 2 - 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`"${pitch.tagline || ''}"`, W / 2, H / 2, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`${idea.targetCity}, Pakistan  |  ${idea.industry}  |  Ask: ${pitch.askAmount || ''}`, W / 2, H / 2 + 15, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Powered by MarketMind', W / 2, H - 15, { align: 'center' });

  // Content slides
  (pitch.slides || []).forEach((slide, i) => {
    doc.addPage();
    // Background
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, W, H, 'F');
    // Left accent bar
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 4, H, 'F');
    // Slide number badge
    doc.setFillColor(26, 26, 46);
    doc.roundedRect(W - 25, 8, 17, 10, 3, 3, 'F');
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${slide.slideNumber}/10`, W - 16.5, 14.5, { align: 'center' });

    // Title
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(11);
    doc.text((ICONS[slide.title] || '') + '  ' + slide.title.toUpperCase(), 14, 18);
    // Heading
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const headingLines = doc.splitTextToSize(`"${slide.heading}"`, W - 28);
    doc.text(headingLines, 14, 34);
    // Divider
    doc.setDrawColor(42, 42, 58);
    doc.line(14, 44, W - 14, 44);
    // Bullets
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    let y = 56;
    (slide.bullets || []).forEach(b => {
      doc.setFillColor(99, 102, 241);
      doc.circle(16, y - 1.5, 1.5, 'F');
      const lines = doc.splitTextToSize(b, W - 36);
      doc.text(lines, 22, y);
      y += lines.length * 7 + 4;
    });
    // Speaker notes
    if (slide.speakerNotes) {
      doc.setFillColor(15, 15, 26);
      doc.rect(0, H - 22, W, 22, 'F');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.text('SPEAKER NOTES:', 14, H - 14);
      doc.setTextColor(100, 116, 139);
      const noteLines = doc.splitTextToSize(slide.speakerNotes, W - 28);
      doc.text(noteLines.slice(0, 2), 14, H - 8);
    }
  });

  // Use of funds page
  if (pitch.useOfFunds?.length) {
    doc.addPage();
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 4, H, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Use of Funds', 14, 24);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    pitch.useOfFunds.forEach((f, i) => {
      doc.text(`${i + 1}. ${f}`, 14, 40 + i * 12);
    });
    if (pitch.exitStrategy) {
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(10);
      doc.text('EXIT STRATEGY', 14, H - 30);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(11);
      doc.text(doc.splitTextToSize(pitch.exitStrategy, W - 28), 14, H - 22);
    }
  }

  doc.save(`${idea.product.replace(/\s+/g, '_')}_Pitch_Deck.pdf`);
}

export async function downloadAnalysisPDF(analysis, idea) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const fmt = v => v >= 1000000 ? `Rs${(v/1000000).toFixed(1)}M` : v >= 1000 ? `Rs${(v/1000).toFixed(0)}K` : `Rs${v}`;

  // Header
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, W, 40, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 38, W, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('Market Analysis Report', 14, 18);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`${idea.product}  ·  ${idea.targetCity}, Pakistan  ·  ${new Date().toLocaleDateString()}`, 14, 30);

  let y = 52;
  const section = (title, color = [99, 102, 241]) => {
    doc.setFillColor(...color); doc.rect(14, y, 3, 5, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y + 4); y += 12;
  };
  const row = (label, value, valueColor = [148, 163, 184]) => {
    doc.setTextColor(100, 116, 139); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(label, 14, y);
    doc.setTextColor(...valueColor); doc.setFont('helvetica', 'bold');
    doc.text(String(value), 100, y); y += 8;
  };

  // Scores
  section('Scores');
  row('Market Demand', `${analysis.demandScore}/100`, [16, 185, 129]);
  row('Competition Score', `${analysis.competitionScore}/100`, [245, 158, 11]);
  row('Viability Score', `${analysis.viabilityScore}/100`, [99, 102, 241]);

  y += 4; section('Market Size');
  row('Total Addressable Market', fmt(analysis.tamEstimate));
  row('Serviceable Market', fmt(analysis.samEstimate));
  row('Obtainable Market', fmt(analysis.somEstimate));

  y += 4; section('Revenue Projections', [16, 185, 129]);
  row('Year 1', fmt(analysis.revenueProjection?.year1));
  row('Year 2', fmt(analysis.revenueProjection?.year2));
  row('Year 3', fmt(analysis.revenueProjection?.year3));

  y += 4; section('Strengths', [16, 185, 129]);
  (analysis.keyStrengths || []).forEach(s => {
    doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`✓ ${s}`, 14, y); y += 7;
  });

  y += 4; section('Risks', [239, 68, 68]);
  (analysis.keyRisks || []).forEach(r => {
    doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`⚠ ${r}`, 14, y); y += 7;
  });

  if (y > H - 40) { doc.addPage(); y = 20; }
  y += 4; section('Opportunities', [245, 158, 11]);
  (analysis.opportunities || []).forEach(o => {
    doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`→ ${o}`, 14, y); y += 7;
  });

  y += 6;
  doc.setFillColor(15, 15, 26); doc.rect(14, y, W - 28, 20, 'F');
  doc.setTextColor(148, 163, 184); doc.setFontSize(10);
  const verdict = doc.splitTextToSize(analysis.overallVerdict || '', W - 36);
  doc.text(verdict, 20, y + 7);

  doc.save(`${idea.product.replace(/\s+/g, '_')}_Analysis_Report.pdf`);
}

export async function downloadSWOTPDF(swot, idea) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(10, 10, 15); doc.rect(0, 0, W, 30, 'F');
  doc.setFillColor(99, 102, 241); doc.rect(0, 28, W, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('SWOT Analysis', 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`${idea.product}  ·  ${idea.targetCity}`, 14, 26);

  const HH = 110;
  const quadrants = [
    { title: 'STRENGTHS', items: swot.strengths, x: 14, y: 38, color: [16, 185, 129] },
    { title: 'WEAKNESSES', items: swot.weaknesses, x: W / 2 + 2, y: 38, color: [239, 68, 68] },
    { title: 'OPPORTUNITIES', items: swot.opportunities, x: 14, y: 38 + HH + 6, color: [245, 158, 11] },
    { title: 'THREATS', items: swot.threats, x: W / 2 + 2, y: 38 + HH + 6, color: [139, 92, 246] },
  ];

  quadrants.forEach(q => {
    const qW = W / 2 - 18;
    doc.setFillColor(15, 15, 26); doc.roundedRect(q.x, q.y, qW, HH, 4, 4, 'F');
    doc.setFillColor(...q.color); doc.roundedRect(q.x, q.y, qW, 12, 4, 4, 'F');
    doc.setFillColor(...q.color); doc.rect(q.x, q.y + 8, qW, 4, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(q.title, q.x + qW / 2, q.y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    let ty = q.y + 20;
    (q.items || []).slice(0, 6).forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, qW - 8);
      doc.text(lines, q.x + 4, ty); ty += lines.length * 5 + 2;
    });
  });

  if (swot.strategicRecommendations) {
    let ry = 38 + HH * 2 + 20;
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Strategic Recommendations', 14, ry); ry += 10;
    Object.entries(swot.strategicRecommendations).forEach(([k, v]) => {
      doc.setFillColor(99, 102, 241); doc.roundedRect(14, ry, 14, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(k, 21, ry + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
      const lines = doc.splitTextToSize(v, W - 40);
      doc.text(lines, 32, ry + 5); ry += Math.max(10, lines.length * 5 + 4);
    });
  }

  doc.save(`${idea.product.replace(/\s+/g, '_')}_SWOT.pdf`);
}

export async function downloadMarketingPDF(plan, meta) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(239, 68, 68); doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Digital Marketing Plan', 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`${meta.product}  ·  ${meta.city}  ·  Budget: PKR ${meta.budget}/mo`, 14, 26);

  let y = 40;
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Marketing Channels', 14, y); y += 8;

  (plan.channels || []).forEach(ch => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(15, 15, 26); doc.roundedRect(14, y, W - 28, 28, 3, 3, 'F');
    doc.setTextColor(239, 68, 68); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(ch.name, 20, y + 8);
    doc.setTextColor(16, 185, 129); doc.setFontSize(9);
    doc.text(`PKR ${(ch.budget || 0).toLocaleString()}/mo  ·  ${(ch.expectedReach || 0).toLocaleString()} reach`, 60, y + 8);
    doc.setTextColor(148, 163, 184); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    (ch.tactics || []).slice(0, 2).forEach((t, ti) => { doc.text(`→ ${t}`, 20, y + 16 + ti * 5); });
    y += 34;
  });

  if (plan.week1Actions?.length) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 4;
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Week 1 Action Plan', 14, y); y += 8;
    plan.week1Actions.forEach((a, i) => {
      doc.setFillColor(99, 102, 241); doc.circle(18, y - 1.5, 4, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(String(i + 1), 18, y + 0.5, { align: 'center' });
      doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(a, W - 36);
      doc.text(lines, 26, y); y += lines.length * 6 + 4;
    });
  }

  doc.save(`${meta.product.replace(/\s+/g, '_')}_Marketing_Plan.pdf`);
}

export async function downloadFundingPDF(data, meta) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(16, 185, 129); doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Funding Sources Report', 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`${meta.product}  ·  Stage: ${meta.stage}  ·  Total Potential: ${data.totalPotential}`, 14, 26);

  let y = 40;
  if (data.topRecommendation) {
    doc.setFillColor(15, 15, 26); doc.roundedRect(14, y, W - 28, 14, 3, 3, 'F');
    doc.setFillColor(16, 185, 129); doc.rect(14, y, 3, 14, 'F');
    doc.setTextColor(16, 185, 129); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('TOP RECOMMENDATION', 20, y + 5);
    doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(doc.splitTextToSize(data.topRecommendation, W - 38), 20, y + 11);
    y += 20;
  }

  (data.sources || []).forEach(s => {
    if (y > 255) { doc.addPage(); y = 20; }
    const cardH = 32;
    doc.setFillColor(15, 15, 26); doc.roundedRect(14, y, W - 28, cardH, 3, 3, 'F');
    const typeColors = { Grant: [16, 185, 129], VC: [99, 102, 241], Angel: [245, 158, 11], Incubator: [139, 92, 246], Bank: [59, 130, 246] };
    const tc = typeColors[s.type] || [100, 116, 139];
    doc.setFillColor(...tc); doc.roundedRect(18, y + 4, 18, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(s.type, 27, y + 8.5, { align: 'center' });
    doc.setFontSize(11); doc.text(s.name, 42, y + 9);
    doc.setTextColor(16, 185, 129); doc.setFontSize(9);
    doc.text(s.amount, W - 16, y + 9, { align: 'right' });
    doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(`Eligibility: ${s.eligibility}`, 18, y + 18);
    doc.text(`How: ${s.howToApply?.slice(0, 70)}${(s.howToApply?.length || 0) > 70 ? '...' : ''}`, 18, y + 24);
    const diffColors = { Easy: [16, 185, 129], Medium: [245, 158, 11], Hard: [239, 68, 68] };
    const dc = diffColors[s.difficulty] || [100, 116, 139];
    doc.setTextColor(...dc); doc.text(`● ${s.difficulty}`, W - 16, y + 24, { align: 'right' });
    y += cardH + 4;
  });

  doc.save(`${meta.product.replace(/\s+/g, '_')}_Funding_Sources.pdf`);
}

export async function downloadLegalPDF(data, idea) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(29, 78, 216); doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Legal Compliance Checklist', 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`${idea.product}  ·  ${idea.targetCity}  ·  Est. Cost: ${data.totalEstimatedCost}`, 14, 26);

  let y = 40;
  const allItems = [
    ...(data.registrations || []).map(r => ({ ...r, section: 'Registration' })),
    ...(data.licenses || []).map(l => ({ ...l, section: 'License' })),
  ];

  allItems.forEach((item, i) => {
    if (y > 255) { doc.addPage(); y = 20; }
    doc.setFillColor(15, 15, 26); doc.roundedRect(14, y, W - 28, 28, 3, 3, 'F');
    doc.setFillColor(item.required ? 239 : 245, item.required ? 68 : 158, item.required ? 68 : 11);
    doc.rect(14, y, 3, 28, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${item.name}`, 22, y + 8);
    doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`${item.authority}  |  ${item.cost}  |  ${item.timeline || ''}`, 22, y + 16);
    doc.setFillColor(30, 30, 50);
    doc.rect(22, y + 20, 5, 5, 'F'); // checkbox
    doc.setTextColor(100, 116, 139); doc.setFontSize(8);
    doc.text('Mark as done', 30, y + 24);
    y += 34;
  });

  doc.save(`${idea.product.replace(/\s+/g, '_')}_Legal_Checklist.pdf`);
}

export async function downloadFullReport(idea, analysis, pitch, swot) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const fmt = v => v >= 1000000 ? `Rs${(v/1000000).toFixed(1)}M` : v >= 1000 ? `Rs${(v/1000).toFixed(0)}K` : `Rs${v}`;

  // Cover
  doc.setFillColor(10, 10, 15); doc.rect(0, 0, W, 297, 'F');
  doc.setFillColor(99, 102, 241); doc.rect(0, 0, 4, 297, 'F');
  doc.setFillColor(99, 102, 241); doc.rect(0, 289, W, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(99, 102, 241);
  doc.text('MARKETMIND COMPLETE REPORT', 14, 30);
  doc.setFontSize(28); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text(idea.product, 14, 60);
  doc.setFontSize(14); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
  doc.text(`${idea.targetCity}, Pakistan`, 14, 72);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PK')}`, 14, 82);

  if (analysis) {
    const scores = [
      { label: 'Market Demand', val: analysis.demandScore, color: [16, 185, 129] },
      { label: 'Viability', val: analysis.viabilityScore, color: [99, 102, 241] },
      { label: 'Competition', val: analysis.competitionScore, color: [245, 158, 11] },
    ];
    scores.forEach((s, i) => {
      const x = 14 + i * 62;
      doc.setFillColor(26, 26, 46); doc.roundedRect(x, 100, 56, 30, 4, 4, 'F');
      doc.setTextColor(...s.color); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text(`${s.val}`, x + 28, 118, { align: 'center' });
      doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(s.label, x + 28, 126, { align: 'center' });
    });

    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Overall Verdict', 14, 148);
    doc.setFillColor(26, 26, 46); doc.roundedRect(14, 152, W - 28, 20, 3, 3, 'F');
    doc.setTextColor(148, 163, 184); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const vLines = doc.splitTextToSize(analysis.overallVerdict || '', W - 36);
    doc.text(vLines.slice(0, 3), 20, 160);

    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Revenue Projections', 14, 186);
    ['year1', 'year2', 'year3'].forEach((yr, i) => {
      const x = 14 + i * 62;
      doc.setFillColor(26, 26, 46); doc.roundedRect(x, 190, 56, 22, 4, 4, 'F');
      doc.setTextColor(16, 185, 129); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text(fmt(analysis.revenueProjection?.[yr] || 0), x + 28, 202, { align: 'center' });
      doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Year ${i + 1}`, x + 28, 208, { align: 'center' });
    });
  }

  doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  doc.text('This report was generated by MarketMind AI. For investment decisions, consult a financial advisor.', 14, 285);

  doc.save(`${idea.product.replace(/\s+/g, '_')}_Full_Report.pdf`);
}
