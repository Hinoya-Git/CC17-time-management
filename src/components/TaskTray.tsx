import React, { useState } from 'react';
import {
  Inbox,
  Plus,
  GripVertical,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  Camera,
  Sparkles,
} from 'lucide-react';
import { Task, TaskCategory } from '../types';
import { CATEGORIES, CATEGORY_LIST } from '../utils/categories';
import { formatDuration } from '../utils/dateUtils';

interface TaskTrayProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAddBacklog: (title: string, category: TaskCategory, duration: number) => void;
  onScheduleTaskQuick: (task: Task) => void;
  isOpen: boolean;
  onClose?: () => void;
  onOpenScannerModal?: () => void;
}

export const TaskTray: React.FC<TaskTrayProps> = ({
  tasks,
  onTaskClick,
  onQuickAddBacklog,
  onScheduleTaskQuick,
  isOpen,
  onClose,
  onOpenScannerModal,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('deep_work');
  const [newDuration, setNewDuration] = useState<number>(45);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const backlogTasks = tasks.filter((t) => t.startTime === null && !t.completed);

  const filteredBacklog = backlogTasks.filter((t) => {
    if (filterCategory === 'all') return true;
    return t.category === filterCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onQuickAddBacklog(newTitle.trim(), newCategory, newDuration);
    setNewTitle('');
  };

  return (
    <aside
      className={`w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full z-20 transition-all ${
        isOpen ? 'block' : 'hidden lg:flex'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Task Backlog Tray
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Drag tasks directly onto calendar
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {backlogTasks.length}
        </span>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleSubmit} className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex flex-col gap-2">
          <input
            id="input-quick-backlog"
            type="text"
            placeholder="Add unscheduled task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center gap-2">
            {/* Category select */}
            <select
              id="select-quick-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
              className="text-[11px] font-medium py-1 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIES[cat].label}
                </option>
              ))}
            </select>

            {/* Duration select */}
            <select
              id="select-quick-duration"
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              className="text-[11px] font-medium py-1 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value={15}>15m</option>
              <option value={30}>30m</option>
              <option value={45}>45m</option>
              <option value={60}>60m</option>
              <option value={90}>90m</option>
            </select>

            <button
              id="btn-submit-quick-backlog"
              type="submit"
              disabled={!newTitle.trim()}
              className="ml-auto flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {onOpenScannerModal && (
            <button
              type="button"
              id="btn-backlog-camera-scan"
              onClick={onOpenScannerModal}
              className="w-full mt-1 py-1.5 px-2.5 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/60 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Notes / Whiteboard with Camera</span>
            </button>
          )}
        </div>
      </form>

      {/* Filter Chips */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 ${
            filterCategory === 'all'
              ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({backlogTasks.length})
        </button>
        {CATEGORY_LIST.map((cat) => {
          const count = backlogTasks.filter((t) => t.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded-full font-medium transition-colors shrink-0 ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {CATEGORIES[cat].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Draggable Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredBacklog.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Unscheduled Tasks
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              All tasks have been placed onto the calendar timeline!
            </p>
          </div>
        ) : (
          filteredBacklog.map((task) => {
            const catMeta = CATEGORIES[task.category] || CATEGORIES.deep_work;

            return (
              <div
                key={task.id}
                id={`backlog-item-${task.id}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', task.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className={`group p-3 rounded-xl border ${catMeta.cardBg} ${catMeta.cardBorder} hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 mt-0.5 shrink-0" />
                  
                  <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${catMeta.badgeBg}`}>
                        {catMeta.label}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {formatDuration(task.duration)}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile / Tap Schedule Quick Button */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Drag to timeline</span>
                  <button
                    id={`btn-schedule-quick-${task.id}`}
                    onClick={() => onScheduleTaskQuick(task)}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
