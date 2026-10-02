import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Minus,
  Sparkles,
  ExternalLink,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { Task, CalendarViewMode, Discrepancy } from '../types';
import { CATEGORIES } from '../utils/categories';
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  HOUR_HEIGHT_PX,
  timeToMinutes,
  minutesToTime,
  formatTime12h,
  formatDuration,
  getCurrentTimeMinutes,
  getTodayString,
  formatDayLabel,
  snapTo15Minutes,
} from '../utils/dateUtils';

interface CalendarGridProps {
  days: string[];
  tasks: Task[];
  discrepancies: Discrepancy[];
  viewMode: CalendarViewMode;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
  onAddTime: (taskId: string, minutes: number, e: React.MouseEvent) => void;
  onDropTime: (taskId: string, minutes: number, e: React.MouseEvent) => void;
  onTaskDrop: (taskId: string, targetDate: string, newStartTime: string) => void;
  onDurationChange: (taskId: string, newDuration: number) => void;
  onSlotClick: (date: string, time: string) => void;
  onOpenDiscrepancyResolve: () => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  tasks,
  discrepancies,
  viewMode,
  onTaskClick,
  onToggleComplete,
  onAddTime,
  onDropTime,
  onTaskDrop,
  onDurationChange,
  onSlotClick,
  onOpenDiscrepancyResolve,
}) => {
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentTimeMinutes());
  const [resizingTaskId, setResizingTaskId] = useState<string | null>(null);
  const resizeStartYRef = useRef<number>(0);
  const resizeInitialDurationRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update current time indicator every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinutes(getCurrentTimeMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to 8:00 AM on initial mount
  useEffect(() => {
    if (containerRef.current) {
      const scrollOffset = (8 - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX - 20;
      containerRef.current.scrollTop = Math.max(0, scrollOffset);
    }
  }, []);

  // Generate hours array (06:00 to 23:00)
  const hours: number[] = [];
  for (let h = CALENDAR_START_HOUR; h <= CALENDAR_END_HOUR; h++) {
    hours.push(h);
  }

  const startTotalMinutes = CALENDAR_START_HOUR * 60;
  const pixelsPerMinute = HOUR_HEIGHT_PX / 60;
  const totalGridHeight = (CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1) * HOUR_HEIGHT_PX;

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle Drop onto a day column
  const handleDayDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const columnRect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - columnRect.top;
    
    // Calculate minutes from top
    const clickedMinutesFromStart = Math.max(0, offsetY / pixelsPerMinute);
    const rawMinutes = startTotalMinutes + clickedMinutesFromStart;
    const snappedMinutes = snapTo15Minutes(rawMinutes);
    const newStartTime = minutesToTime(snappedMinutes);

    onTaskDrop(taskId, date, newStartTime);
  };

  // Resize duration handling
  const startResize = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setResizingTaskId(task.id);
    resizeStartYRef.current = e.clientY;
    resizeInitialDurationRef.current = task.duration;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - resizeStartYRef.current;
      const deltaMinutes = Math.round(deltaY / pixelsPerMinute / 15) * 15;
      const newDuration = Math.max(15, resizeInitialDurationRef.current + deltaMinutes);
      onDurationChange(task.id, newDuration);
    };

    const handleMouseUp = () => {
      setResizingTaskId(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/60 select-none relative"
      style={{ minHeight: '600px', maxHeight: 'calc(100vh - 120px)' }}
    >
      {/* Grid Container */}
      <div className="flex relative" style={{ minWidth: viewMode === 'week' ? '850px' : '100%' }}>
        
        {/* Time Labels Column */}
        <div className="w-14 sm:w-18 shrink-0 bg-white/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 z-10 sticky left-0 text-slate-500 dark:text-slate-400">
          
          {/* Top spacer matching day header */}
          <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Time
          </div>

          {/* Hourly marks */}
          <div className="relative" style={{ height: `${totalGridHeight}px` }}>
            {hours.map((h) => {
              const displayHour = h % 12 === 0 ? 12 : h % 12;
              const period = h >= 12 ? 'PM' : 'AM';
              return (
                <div
                  key={h}
                  className="absolute w-full text-right pr-2 sm:pr-3 text-[11px] font-medium"
                  style={{ top: `${(h - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX - 8}px` }}
                >
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{displayHour}</span>{' '}
                  <span className="text-[10px] text-slate-400">{period}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Days Columns */}
        <div className="flex-1 flex divide-x divide-slate-200 dark:divide-slate-800">
          {days.map((dateStr) => {
            const { dayName, formattedDate, isToday } = formatDayLabel(dateStr);
            const dayTasks = tasks.filter((t) => t.date === dateStr && t.startTime !== null);
            const dayDiscrepancies = discrepancies.filter((d) => {
              const t = tasks.find((item) => item.id === d.taskId);
              return t && t.date === dateStr;
            });

            return (
              <div
                key={dateStr}
                className="flex-1 flex flex-col min-w-[220px] relative bg-white/50 dark:bg-slate-900/50"
              >
                {/* Day Header */}
                <div
                  className={`h-12 px-3 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors ${
                    isToday
                      ? 'bg-indigo-50/90 border-indigo-200 dark:bg-indigo-950/70 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                      : 'bg-white/95 border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayName}
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {formattedDate}
                    </span>
                  </div>

                  {dayDiscrepancies.length > 0 && (
                    <button
                      onClick={onOpenDiscrepancyResolve}
                      title={`${dayDiscrepancies.length} discrepancy conflicts detected. Click to resolve with collateral.`}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-200 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{dayDiscrepancies.length} conflict</span>
                    </button>
                  )}
                </div>

                {/* Day Time Slots Grid & Droppable Surface */}
                <div
                  id={`calendar-day-col-${dateStr}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDayDrop(e, dateStr)}
                  className="relative flex-1"
                  style={{ height: `${totalGridHeight}px` }}
                >
                  {/* Horizontal Hour & Half-Hour Grid Lines */}
                  {hours.map((h) => {
                    const topOffset = (h - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX;
                    return (
                      <React.Fragment key={h}>
                        {/* Top of hour line */}
                        <div
                          className="absolute w-full border-b border-slate-200/80 dark:border-slate-800/80 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer transition-colors"
                          style={{ top: `${topOffset}px`, height: `${HOUR_HEIGHT_PX}px` }}
                          onClick={() => onSlotClick(dateStr, minutesToTime(h * 60))}
                          title={`Click to schedule task at ${h}:00`}
                        />
                        {/* Half-hour dashed line */}
                        <div
                          className="absolute w-full border-b border-dashed border-slate-200/50 dark:border-slate-800/50 pointer-events-none"
                          style={{ top: `${topOffset + HOUR_HEIGHT_PX / 2}px` }}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Real-Time Current Time Indicator (if day is Today) */}
                  {isToday &&
                    currentMinutes >= startTotalMinutes &&
                    currentMinutes <= CALENDAR_END_HOUR * 60 + 60 && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{
                          top: `${(currentMinutes - startTotalMinutes) * pixelsPerMinute}px`,
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-300 dark:ring-rose-900 animate-pulse -ml-1.5" />
                        <div className="flex-1 h-0.5 bg-rose-500 dark:bg-rose-600 shadow-xs" />
                        <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900 mr-2 shadow-xs">
                          {formatTime12h(minutesToTime(currentMinutes))}
                        </span>
                      </div>
                    )}

                  {/* Rendered Scheduled Tasks */}
                  {dayTasks.map((task) => {
                    const taskStartMin = timeToMinutes(task.startTime!);
                    const topPx = Math.max(0, (taskStartMin - startTotalMinutes) * pixelsPerMinute);
                    const heightPx = Math.max(34, task.duration * pixelsPerMinute - 4);

                    const categoryMeta = CATEGORIES[task.category] || CATEGORIES.deep_work;
                    const isResizing = resizingTaskId === task.id;

                    // Check if this task has an active overlap discrepancy
                    const hasOverlap = dayDiscrepancies.some(
                      (d) => d.type === 'overlap' && (d.taskId === task.id || d.conflictingTaskId === task.id)
                    );

                    const endTimeStr = minutesToTime(taskStartMin + task.duration);

                    return (
                      <div
                        key={task.id}
                        id={`task-block-${task.id}`}
                        draggable={!isResizing}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => onTaskClick(task)}
                        className={`absolute left-1.5 right-1.5 rounded-xl border p-2 text-xs transition-all shadow-xs cursor-pointer group select-none flex flex-col justify-between overflow-hidden ${
                          categoryMeta.cardBg
                        } ${
                          hasOverlap
                            ? 'ring-2 ring-rose-500 border-rose-400 dark:border-rose-600'
                            : categoryMeta.cardBorder
                        } ${task.completed ? 'opacity-65 line-through' : 'opacity-100 hover:shadow-md'}`}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          zIndex: hasOverlap ? 15 : 10,
                        }}
                      >
                        {/* Top Header Row */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {/* Complete Toggle Button */}
                            <button
                              id={`check-task-${task.id}`}
                              onClick={(e) => onToggleComplete(task.id, e)}
                              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-transform active:scale-90 shrink-0"
                              title={task.completed ? 'Mark as pending' : 'Mark as completed'}
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            {/* Task Title */}
                            <h2
                              className={`font-semibold text-xs truncate leading-snug ${
                                task.completed ? 'line-through text-slate-500' : categoryMeta.cardText
                              }`}
                            >
                              {task.title}
                            </h2>
                          </div>

                          {/* Duration Badge & Sync Source */}
                          <div className="flex items-center gap-1 shrink-0">
                            {task.syncSource === 'google' && (
                              <span
                                title="Synced with Google Calendar"
                                className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold text-[9px] flex items-center justify-center"
                              >
                                G
                              </span>
                            )}
                            {task.syncSource === 'outlook' && (
                              <span
                                title="Synced with Outlook"
                                className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 font-bold text-[9px] flex items-center justify-center"
                              >
                                O
                              </span>
                            )}
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                              {formatDuration(task.duration)}
                            </span>
                          </div>
                        </div>

                        {/* Middle Row: Time range and Overlap banner */}
                        <div className="my-0.5 flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-70" />
                            <span>
                              {formatTime12h(task.startTime!)} - {formatTime12h(endTimeStr)}
                            </span>
                          </span>

                          {/* Discrepancy indicator */}
                          {hasOverlap && (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/70 px-1.5 py-0.5 rounded border border-rose-300 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                              Overlap
                            </span>
                          )}
                        </div>

                        {/* Bottom Row: Quick Collateral Add/Drop Discrepancy Buttons (Visible on hover or touch) */}
                        {heightPx >= 65 && (
                          <div
                            className="mt-auto pt-1 flex items-center justify-between border-t border-black/5 dark:border-white/5 text-[10px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              Collateral:
                            </span>
                            <div className="flex items-center gap-1">
                              {/* Drop 15m button */}
                              <button
                                id={`btn-drop-15-${task.id}`}
                                onClick={(e) => onDropTime(task.id, 15, e)}
                                title="Drop 15m (Freed collateral buffer)"
                                className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/70 dark:border-slate-700 flex items-center gap-0.5 active:scale-95"
                              >
                                <Minus className="w-2.5 h-2.5" />
                                <span>15m</span>
                              </button>

                              {/* Add 15m button */}
                              <button
                                id={`btn-add-15-${task.id}`}
                                onClick={(e) => onAddTime(task.id, 15, e)}
                                title="Add 15m (Absorb from collateral / cascade shift)"
                                className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/70 dark:border-slate-700 flex items-center gap-0.5 active:scale-95"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>15m</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Bottom Edge Resize Handle */}
                        <div
                          onMouseDown={(e) => startResize(e, task)}
                          title="Drag to adjust duration"
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-indigo-400/40 rounded-b-xl flex items-center justify-center transition-colors"
                        >
                          <div className="w-8 h-1 bg-slate-400/40 rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
