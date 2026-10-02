// Helper to generate realistic visual sample documents on HTML5 canvas for OCR and schedule scanning testing

export interface SampleDocumentPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  generateDataUrl: () => string;
}

export function generateStickyNotesSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background desk surface
  ctx.fillStyle = '#f1ece1';
  ctx.fillRect(0, 0, 900, 700);

  // Desk wood grain / subtle pattern
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let i = 0; i < 700; i += 8) {
    ctx.fillRect(0, i, 900, 1);
  }

  // Shadow helper
  const drawShadow = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(x + 6, y + 6, w, h);
  };

  // 1. Yellow Sticky Note (Morning tasks)
  drawShadow(60, 60, 360, 320);
  ctx.fillStyle = '#fef08a'; // yellow-200
  ctx.fillRect(60, 60, 360, 320);

  // Tape on top
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(180, 50, 120, 24);

  // Handwritten title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('TODAY PRIORITIES', 90, 110);

  ctx.font = '19px system-ui, -apple-system, sans-serif';
  ctx.fillText('• 09:00 - 10:00 AM : Team Sprint Sync', 85, 160);
  ctx.fillText('• 10:30 - 11:30 AM : Architecture Review', 85, 205);
  ctx.fillText('• 11:45 AM : Quick Coffee & Admin emails', 85, 250);
  ctx.fillText('• 12:30 PM : Healthy Lunch break', 85, 295);

  ctx.fillStyle = '#b45309';
  ctx.font = 'italic 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('* Prepare slide deck before 1pm!', 85, 345);

  // 2. Pink Sticky Note (Deep Work & Afternoon)
  drawShadow(460, 70, 380, 300);
  ctx.fillStyle = '#fbcfe8'; // pink-200
  ctx.fillRect(460, 70, 380, 300);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(580, 60, 120, 24);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
  ctx.fillText('AFTERNOON DEEP WORK', 490, 120);

  ctx.font = '19px system-ui, -apple-system, sans-serif';
  ctx.fillText('• 13:30 - 15:00 : Client Demo & QA', 490, 170);
  ctx.fillText('• 15:15 - 16:45 : Code Refactor & API', 490, 215);
  ctx.fillText('• 17:00 - 18:00 : 5km Run & Gym workout', 490, 260);

  ctx.fillStyle = '#9d174d';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('[HIGH PRIORITY: Deliver MVP build]', 490, 320);

  // 3. Blue Note Pad at bottom
  drawShadow(160, 420, 580, 220);
  ctx.fillStyle = '#bae6fd'; // sky-200
  ctx.fillRect(160, 420, 580, 220);

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('EVENING STUDY & LEARNING SCHEDULE', 190, 465);

  ctx.fillStyle = '#1e293b';
  ctx.font = '19px system-ui, -apple-system, sans-serif';
  ctx.fillText('• 19:30 - 20:30 : Read Distributed Systems Chapter 4', 190, 515);
  ctx.fillText('• 21:00 - 21:30 : Review Daily Discrepancies & Prep Tomorrow', 190, 560);

  ctx.fillStyle = '#0f766e';
  ctx.font = 'italic 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Target: 4.5 hours deep work focus logged today', 190, 605);

  return canvas.toDataURL('image/png');
}

export function generateConferenceAgendaSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Crisp printed paper sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 900, 700);

  // Document border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 820, 620);

  // Header band
  ctx.fillStyle = '#4338ca'; // indigo-700
  ctx.fillRect(40, 40, 820, 85);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('GLOBAL TECH SUMMIT 2026', 70, 90);
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Official Attendee Schedule & Workshop Track', 70, 115);

  // Table items
  const items = [
    { time: '09:00 - 10:15', title: 'Opening Keynote: The Future of Autonomous Systems', room: 'Main Auditorium', cat: 'Learning' },
    { time: '10:30 - 11:45', title: 'Interactive Workshop: High-Performance TypeScript', room: 'Lab Hall B', cat: 'Deep Work' },
    { time: '12:00 - 13:00', title: 'Executive Networking Lunch & Discussion', room: 'Dining Terrace', cat: 'Meeting' },
    { time: '13:30 - 14:45', title: 'Panel: Cloud Architecture & Scalability at Scale', room: 'Stage 2', cat: 'Learning' },
    { time: '15:15 - 16:30', title: 'Deep Work Hackathon Session: Build & Ship MVP', room: 'Innovation Lab', cat: 'Deep Work' },
    { time: '17:00 - 18:00', title: 'Closing Remarks & Project Showcase', room: 'Main Auditorium', cat: 'Meeting' },
  ];

  let y = 175;
  items.forEach((item, index) => {
    // Zebra striping
    if (index % 2 === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(50, y - 25, 800, 60);
    }

    ctx.fillStyle = '#312e81';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(item.time, 70, y + 10);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(item.title, 240, y + 2);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Location: ${item.room} • Track: ${item.cat}`, 240, y + 24);

    y += 75;
  });

  return canvas.toDataURL('image/png');
}

export function generateWhiteboardSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Whiteboard enamel glossy background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 900, 700);

  // Aluminum border frame
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 886, 686);

  // Dry erase marker title (blue marker)
  ctx.fillStyle = '#1d4ed8'; // blue-700
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('SPRINT 14 RELEASE - CRITICAL MILESTONES', 50, 75);

  // Divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, 95);
  ctx.lineTo(840, 95);
  ctx.stroke();

  // Column 1: Morning Focus (Red Marker for Urgent)
  ctx.fillStyle = '#b91c1c'; // red-700
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('[!] URGENT ACTION ITEMS:', 50, 140);

  ctx.fillStyle = '#0f172a';
  ctx.font = '19px system-ui, -apple-system, sans-serif';
  ctx.fillText('1. 08:30 - 09:30 : Hotfix Production Auth Loop (URGENT)', 50, 185);
  ctx.fillText('2. 10:00 - 11:00 : Database Schema Migration & Indexing', 50, 235);
  ctx.fillText('3. 11:15 - 12:15 : Client Security Audit & Review Call', 50, 285);

  // Column 2: Afternoon Focus (Green Marker)
  ctx.fillStyle = '#15803d'; // green-700
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('[>] AFTERNOON SPRINT BLOCKS:', 50, 360);

  ctx.fillStyle = '#0f172a';
  ctx.font = '19px system-ui, -apple-system, sans-serif';
  ctx.fillText('4. 13:30 - 15:00 : Front-end UI Components Polish (Deep Work)', 50, 405);
  ctx.fillText('5. 15:30 - 16:30 : Weekly Engineering All-Hands Sync', 50, 455);
  ctx.fillText('6. 17:00 - 17:45 : Daily Retrospective & Collateral Buffer Log', 50, 505);

  // Eraser wipe mark effect
  ctx.fillStyle = 'rgba(203, 213, 225, 0.2)';
  ctx.fillRect(50, 560, 790, 75);

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 17px system-ui, -apple-system, sans-serif';
  ctx.fillText('Note: Keep 30 min buffer pool available to prevent downstream delay cascades.', 65, 605);

  return canvas.toDataURL('image/png');
}

export const SAMPLE_PRESETS: SampleDocumentPreset[] = [
  {
    id: 'sticky-notes',
    name: 'Sticky Notes & Desk Pad',
    badge: 'Handwritten',
    description: 'Post-it notes with morning & afternoon tasks, timestamps, and priority tags.',
    generateDataUrl: generateStickyNotesSample,
  },
  {
    id: 'conference-agenda',
    name: 'Conference / Seminar Agenda',
    badge: 'Printed Document',
    description: 'Structured event schedule with session times, topics, and room locations.',
    generateDataUrl: generateConferenceAgendaSample,
  },
  {
    id: 'whiteboard',
    name: 'Sprint Whiteboard',
    badge: 'Team Board',
    description: 'Dry-erase whiteboard with urgent production bugs, migrations, and team syncs.',
    generateDataUrl: generateWhiteboardSample,
  },
];
