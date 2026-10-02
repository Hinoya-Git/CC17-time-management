import { Task, DailyReportData, TaskCategory, CollateralState } from '../types';
import { CATEGORIES } from './categories';
import { formatDuration } from './dateUtils';
import { detectDiscrepancies } from './collateralEngine';

export function generateDailyReport(
  tasks: Task[],
  date: string,
  collateral: CollateralState
): DailyReportData {
  const dayTasks = tasks.filter((t) => t.date === date);
  const scheduledDayTasks = dayTasks.filter((t) => t.startTime !== null);

  const totalScheduledMinutes = scheduledDayTasks.reduce((acc, t) => acc + t.duration, 0);
  const completedTasks = dayTasks.filter((t) => t.completed);
  const totalCompletedMinutes = completedTasks.reduce(
    (acc, t) => acc + (t.actualDuration !== undefined ? t.actualDuration : t.duration),
    0
  );

  const completionRate =
    dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0;

  // Category breakdown
  const categoryBreakdown: Record<TaskCategory, { minutes: number; count: number; percentage: number }> = {
    deep_work: { minutes: 0, count: 0, percentage: 0 },
    meeting: { minutes: 0, count: 0, percentage: 0 },
    admin: { minutes: 0, count: 0, percentage: 0 },
    learning: { minutes: 0, count: 0, percentage: 0 },
    health: { minutes: 0, count: 0, percentage: 0 },
    personal: { minutes: 0, count: 0, percentage: 0 },
    urgent: { minutes: 0, count: 0, percentage: 0 },
  };

  dayTasks.forEach((t) => {
    if (categoryBreakdown[t.category]) {
      const mins = t.completed && t.actualDuration !== undefined ? t.actualDuration : t.duration;
      categoryBreakdown[t.category].minutes += mins;
      categoryBreakdown[t.category].count += 1;
    }
  });

  const totalTrackedMinutes = Object.values(categoryBreakdown).reduce((acc, c) => acc + c.minutes, 0);

  let topCategory = 'Deep Work';
  let maxMinutes = -1;

  (Object.keys(categoryBreakdown) as TaskCategory[]).forEach((cat) => {
    const mins = categoryBreakdown[cat].minutes;
    categoryBreakdown[cat].percentage =
      totalTrackedMinutes > 0 ? Math.round((mins / totalTrackedMinutes) * 100) : 0;
    if (mins > maxMinutes) {
      maxMinutes = mins;
      topCategory = CATEGORIES[cat]?.label || cat;
    }
  });

  // Discrepancy analysis
  const discrepancies = detectDiscrepancies(tasks, date);
  const overrunMinutes = discrepancies
    .filter((d) => d.type === 'overrun')
    .reduce((acc, d) => acc + d.diffMinutes, 0);
  const underrunMinutes = discrepancies
    .filter((d) => d.type === 'underrun')
    .reduce((acc, d) => acc + d.diffMinutes, 0);
  const overlapCount = discrepancies.filter((d) => d.type === 'overlap').length;

  // Productivity Score calculation (0 to 100)
  // Base: 40% completion rate, 25% deep work ratio, 20% discrepancy stability, 15% high priority completed
  const deepWorkPercentage = categoryBreakdown.deep_work?.percentage || 0;
  const highPriorityTotal = dayTasks.filter((t) => t.priority === 'high').length;
  const highPriorityDone = dayTasks.filter((t) => t.priority === 'high' && t.completed).length;
  const highPriorityRate = highPriorityTotal > 0 ? highPriorityDone / highPriorityTotal : 1;

  const discrepancyPenalty = Math.min(25, overlapCount * 8 + (overrunMinutes > 45 ? 10 : 0));

  let score = Math.round(
    completionRate * 0.45 +
    Math.min(30, deepWorkPercentage * 0.4) +
    highPriorityRate * 25 -
    discrepancyPenalty
  );
  score = Math.max(10, Math.min(100, score));

  // Key Accomplishments
  const keyAccomplishments = completedTasks.map((t) => {
    const timeInfo = t.startTime ? ` [${t.startTime}]` : '';
    const durInfo = ` (${formatDuration(t.actualDuration || t.duration)})`;
    return `${t.title}${timeInfo}${durInfo}`;
  });

  return {
    date,
    totalScheduledMinutes,
    totalCompletedMinutes,
    completionRate,
    totalTasks: dayTasks.length,
    completedTasks: completedTasks.length,
    overdueTasks: dayTasks.length - completedTasks.length,
    productivityScore: score,
    topCategory,
    categoryBreakdown,
    discrepancies: {
      totalCount: discrepancies.length,
      overrunMinutes,
      underrunMinutes,
      overlapCount,
      netDiscrepancyMinutes: overrunMinutes - underrunMinutes,
    },
    keyAccomplishments,
  };
}

export function formatReportMarkdown(report: DailyReportData): string {
  const lines = [
    `# Daily Progress Report - ${report.date}`,
    ``,
    `**Productivity Score:** ${report.productivityScore}/100`,
    `**Completion Rate:** ${report.completionRate}% (${report.completedTasks}/${report.totalTasks} tasks)`,
    `**Time Invested:** ${formatDuration(report.totalCompletedMinutes)} (Planned: ${formatDuration(report.totalScheduledMinutes)})`,
    `**Top Focus Area:** ${report.topCategory}`,
    ``,
    `## ⏱️ Scheduling Collateral & Discrepancies`,
    `- Overlapping Conflicts: ${report.discrepancies.overlapCount}`,
    `- Overrun Time: ${report.discrepancies.overrunMinutes}m`,
    `- Time Saved (Underrun): ${report.discrepancies.underrunMinutes}m`,
    `- Net Variance: ${report.discrepancies.netDiscrepancyMinutes > 0 ? '+' : ''}${report.discrepancies.netDiscrepancyMinutes}m`,
    ``,
    `## 📊 Category Distribution`,
  ];

  (Object.keys(report.categoryBreakdown) as TaskCategory[]).forEach((cat) => {
    const item = report.categoryBreakdown[cat];
    if (item.count > 0) {
      lines.push(`- **${CATEGORIES[cat]?.label}:** ${formatDuration(item.minutes)} (${item.percentage}%, ${item.count} tasks)`);
    }
  });

  lines.push(``, `## ✅ Completed Accomplishments`);
  if (report.keyAccomplishments.length === 0) {
    lines.push(`_No tasks marked as completed yet for this date._`);
  } else {
    report.keyAccomplishments.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  if (report.aiSummary) {
    lines.push(``, `## 🤖 Executive Insights`, report.aiSummary.summary, ``);
    if (report.aiSummary.strengths?.length > 0) {
      lines.push(`### Key Strengths`);
      report.aiSummary.strengths.forEach((s) => lines.push(`- ${s}`));
    }
    if (report.aiSummary.recommendations?.length > 0) {
      lines.push(``, `### Next Steps & Collateral Advice`);
      report.aiSummary.recommendations.forEach((r) => lines.push(`- ${r}`));
    }
  }

  return lines.join('\n');
}
