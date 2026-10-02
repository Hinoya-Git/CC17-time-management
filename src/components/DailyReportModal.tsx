import React, { useState } from 'react';
import {
  X,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertTriangle,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Task, CollateralState, TaskCategory } from '../types';
import { generateDailyReport, formatReportMarkdown } from '../utils/reportEngine';
import { CATEGORIES } from '../utils/categories';
import { formatDuration, formatDayLabel, addDays } from '../utils/dateUtils';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  collateral: CollateralState;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  selectedDate,
  onDateChange,
  collateral,
}) => {
  const [copied, setCopied] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<{
    summary: string;
    strengths: string[];
    recommendations: string[];
  } | null>(null);

  if (!isOpen) return null;

  const report = generateDailyReport(tasks, selectedDate, collateral);
  const { dayName, formattedDate, isToday } = formatDayLabel(selectedDate);

  const handleCopyMarkdown = () => {
    const fullReport = {
      ...report,
      aiSummary: aiReport ? { ...aiReport, aiGenerated: true } : undefined,
    };
    const markdown = formatReportMarkdown(fullReport);
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAiInsights = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          tasks: tasks.filter((t) => t.date === selectedDate),
          stats: {
            totalTasks: report.totalTasks,
            completedTasks: report.completedTasks,
            completionRate: report.completionRate,
            completedMinutes: report.totalCompletedMinutes,
            topCategory: report.topCategory,
            productivityScore: report.productivityScore,
            overdueCount: report.overdueTasks,
          },
          collateral: {
            bufferBankMinutes: collateral.bufferBankMinutes,
            usedBufferMinutes: collateral.usedBufferMinutes,
            discrepancyCount: report.discrepancies.totalCount,
            overrunMinutes: report.discrepancies.overrunMinutes,
            underrunMinutes: report.discrepancies.underrunMinutes,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiReport({
          summary: data.summary,
          strengths: data.strengths || [],
          recommendations: data.recommendations || [],
        });
      }
    } catch (err) {
      console.error('Error generating AI report:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Automated Daily Progress Report
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance analytics, focus distribution & discrepancy review
              </p>
            </div>
          </div>

          {/* Date Navigator in Header */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => onDateChange(addDays(selectedDate, -1))}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              title="Previous day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-semibold text-slate-800 dark:text-slate-200">
              {dayName}, {formattedDate}
            </span>
            <button
              onClick={() => onDateChange(addDays(selectedDate, 1))}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              title="Next day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Top Score & Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Productivity Score */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                <span className="text-[10px] font-bold uppercase tracking-wider">Productivity</span>
                <Flame className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-indigo-900 dark:text-indigo-100">
                  {report.productivityScore}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">/100</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                {report.productivityScore >= 80 ? 'Exceptional flow' : 'Solid progress'}
              </span>
            </div>

            {/* Completion Rate */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Completion Rate
              </span>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {report.completionRate}%
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {report.completedTasks} of {report.totalTasks} tasks done
              </span>
            </div>

            {/* Time Invested */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tracked Time
              </span>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatDuration(report.totalCompletedMinutes)}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Planned: {formatDuration(report.totalScheduledMinutes)}
              </span>
            </div>

            {/* Discrepancy & Collateral */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Collateral Net
              </span>
              <div className="mt-2">
                <span className="text-2xl font-black text-amber-900 dark:text-amber-100">
                  {report.discrepancies.netDiscrepancyMinutes > 0 ? '+' : ''}
                  {report.discrepancies.netDiscrepancyMinutes}m
                </span>
              </div>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                {report.discrepancies.overrunMinutes}m over / {report.discrepancies.underrunMinutes}m saved
              </span>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Category Focus Distribution
              </h3>
              <span className="text-[11px] text-slate-500">
                Lead: <strong className="text-slate-800 dark:text-slate-200">{report.topCategory}</strong>
              </span>
            </div>

            {/* Visual stacked progress bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
              {(Object.keys(report.categoryBreakdown) as TaskCategory[]).map((cat) => {
                const item = report.categoryBreakdown[cat];
                if (item.percentage === 0) return null;
                const meta = CATEGORIES[cat];
                return (
                  <div
                    key={cat}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: meta?.accentColor || '#6366f1',
                    }}
                    title={`${meta.label}: ${item.percentage}% (${formatDuration(item.minutes)})`}
                  />
                );
              })}
            </div>

            {/* Legend row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
              {(Object.keys(report.categoryBreakdown) as TaskCategory[]).map((cat) => {
                const item = report.categoryBreakdown[cat];
                if (item.count === 0) return null;
                const meta = CATEGORIES[cat];
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.accentColor }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 truncate">{meta.label}:</span>
                    <span className="font-semibold text-slate-900 dark:text-white ml-auto">
                      {formatDuration(item.minutes)} ({item.percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Accomplishments */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Key Accomplishments ({report.completedTasks})</span>
            </h3>

            {report.keyAccomplishments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                No tasks marked completed yet for {formattedDate}. Check tasks off on your calendar to populate accomplishments!
              </p>
            ) : (
              <ul className="space-y-1.5 pt-1">
                {report.keyAccomplishments.map((acc, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{acc}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AI Executive Insights & Coaching */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50/60 to-indigo-50/60 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/80 dark:border-violet-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="text-xs font-bold text-violet-950 dark:text-violet-200">
                  AI Executive Insights & Recommendations
                </h3>
              </div>

              <button
                id="btn-generate-ai-report"
                onClick={handleGenerateAiInsights}
                disabled={loadingAi}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 rounded-lg shadow-xs transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>{loadingAi ? 'Analyzing...' : aiReport ? 'Re-Analyze' : 'Analyze Day'}</span>
              </button>
            </div>

            {aiReport ? (
              <div className="space-y-2.5 text-xs text-slate-800 dark:text-slate-200 pt-1">
                <p className="leading-relaxed bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-violet-100 dark:border-violet-900">
                  {aiReport.summary}
                </p>

                {aiReport.strengths?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-violet-900 dark:text-violet-300 text-[11px] uppercase tracking-wider mb-1">
                      Key Execution Strengths
                    </h4>
                    <ul className="space-y-1">
                      {aiReport.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="text-violet-600">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReport.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-violet-900 dark:text-violet-300 text-[11px] uppercase tracking-wider mb-1">
                      Collateral & Tomorrow Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {aiReport.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="text-indigo-600">→</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-violet-800 dark:text-violet-300">
                Click "Analyze Day" to generate an executive evaluation of your schedule execution, discrepancy mitigation, and buffer balance.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between shrink-0">
          <button
            id="btn-copy-report-markdown"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
