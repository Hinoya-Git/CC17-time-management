import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar as CalendarIcon,
  Tag,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Plus,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority } from '../types';
import { CATEGORIES, CATEGORY_LIST } from '../utils/categories';
import { createGoogleCalendarUrl, createOutlookCalendarUrl } from '../utils/calendarSync';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Partial<Task> | null;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  defaultDate: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('deep_work');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [date, setDate] = useState(defaultDate);
  const [isScheduled, setIsScheduled] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState<number>(45);
  const [actualDuration, setActualDuration] = useState<string>('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCategory(task.category || 'deep_work');
      setPriority(task.priority || 'medium');
      setDate(task.date || defaultDate);
      setIsScheduled(task.startTime !== null && task.startTime !== undefined);
      setStartTime(task.startTime || '09:00');
      setDuration(task.duration || 45);
      setActualDuration(task.actualDuration !== undefined ? String(task.actualDuration) : '');
      setCompleted(task.completed || false);
    } else {
      setTitle('');
      setDescription('');
      setCategory('deep_work');
      setPriority('medium');
      setDate(defaultDate);
      setIsScheduled(true);
      setStartTime('09:00');
      setDuration(45);
      setActualDuration('');
      setCompleted(false);
    }
  }, [task, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      date,
      startTime: isScheduled ? startTime : null,
      duration,
      actualDuration: actualDuration ? parseInt(actualDuration, 10) : undefined,
      completed,
    });
    onClose();
  };

  const currentTaskForLinks: Task = {
    id: task?.id || 'temp',
    title: title || 'New Task',
    description,
    category,
    priority,
    date,
    startTime: isScheduled ? startTime : '09:00',
    duration,
    completed,
  };

  const googleUrl = isScheduled ? createGoogleCalendarUrl(currentTaskForLinks) : '';
  const outlookUrl = isScheduled ? createOutlookCalendarUrl(currentTaskForLinks) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CATEGORIES[category]?.accentColor || '#6366f1' }}
            />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {task?.id ? 'Edit Task & Schedule' : 'Schedule New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              id="input-task-title"
              type="text"
              required
              placeholder="e.g., Deep Work: Architecture Spec..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Notes
            </label>
            <textarea
              id="input-task-desc"
              rows={2}
              placeholder="Add key objectives or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Category Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category (Color-Coded)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CATEGORY_LIST.map((cat) => {
                const meta = CATEGORIES[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${meta.cardBg} ${meta.cardBorder} ring-2 ring-indigo-500 font-semibold`
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.accentColor }}
                    />
                    <span className="text-xs truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Scheduled Date
              </label>
              <input
                id="input-task-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-800/50">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                      priority === p
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduling Mode Switcher */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Calendar Time Slot
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {isScheduled ? 'Assigned to timeline' : 'Keep in Backlog'}
                </span>
              </label>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Start Time
                  </label>
                  <input
                    id="input-task-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Duration: {duration} mins
                  </label>
                  <div className="flex items-center gap-1">
                    {[15, 30, 45, 60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-1 text-[11px] font-medium rounded border ${
                          duration === d
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actual Duration for Scheduling Discrepancy Tracking */}
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Actual Duration Spent (Discrepancy Tracking)
              </label>
              {actualDuration && parseInt(actualDuration, 10) !== duration && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  {parseInt(actualDuration, 10) > duration ? '+' : ''}
                  {parseInt(actualDuration, 10) - duration}m variance
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="input-actual-duration"
                type="number"
                min="0"
                step="5"
                placeholder={`Default: ${duration}m`}
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                className="w-32 text-xs px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                Minutes actually taken (helps measure schedule overrun/underrun).
              </span>
            </div>
          </div>

          {/* Direct Calendar Cross-Sync Links */}
          {isScheduled && task?.id && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Quick Sync:</span>
              <a
                href={googleUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 transition-colors"
              >
                <span>Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={outlookUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-900 transition-colors"
              >
                <span>Outlook</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Modal Footer / Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {task?.id && onDelete ? (
              <button
                type="button"
                id="btn-delete-task"
                onClick={() => onDelete(task.id!)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-task"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs shadow-indigo-200 dark:shadow-none transition-colors"
              >
                {task?.id ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
