import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  AlertTriangle,
  Clock,
  Sparkles,
  User,
  Camera,
} from 'lucide-react';
import { CalendarViewMode, CollateralState, Discrepancy } from '../types';
import { formatDayLabel, addDays, getTodayString } from '../utils/dateUtils';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  collateral: CollateralState;
  discrepancies: Discrepancy[];
  onOpenTaskModal: () => void;
  onOpenCollateralModal: () => void;
  onOpenProfileModal: (tab?: 'account' | 'settings' | 'activity' | 'about') => void;
  onOpenSyncModal: () => void;
  onOpenScannerModal: () => void;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  collateral,
  discrepancies,
  onOpenTaskModal,
  onOpenCollateralModal,
  onOpenProfileModal,
  onOpenSyncModal,
  onOpenScannerModal,
  userName = 'Ian Charles',
}) => {
  const { dayName, formattedDate, isToday } = formatDayLabel(selectedDate);
  const overlapCount = discrepancies.filter((d) => d.type === 'overlap').length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          
          {/* Brand & Date Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                <Clock className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                  TimeFlow
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Interactive Daily Calendar
                </p>
              </div>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
              <button
                id="btn-prev-day"
                onClick={() => onDateChange(addDays(selectedDate, -1))}
                aria-label="Previous day"
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                id="btn-today"
                onClick={() => onDateChange(getTodayString())}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  isToday
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Today
              </button>

              <button
                id="btn-next-day"
                onClick={() => onDateChange(addDays(selectedDate, 1))}
                aria-label="Next day"
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

              <div className="relative hidden sm:flex items-center">
                <input
                  id="date-picker-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && onDateChange(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                />
                <div className="px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {dayName}, {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Date Header text */}
            <span className="sm:hidden text-xs font-medium text-slate-700 dark:text-slate-300">
              {dayName}, {formattedDate}
            </span>
          </div>

          {/* Center: View Switcher (Day, 3-Day, Week) */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              id="view-mode-day"
              onClick={() => onViewModeChange('day')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              id="view-mode-3day"
              onClick={() => onViewModeChange('3day')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === '3day'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              3-Day
            </button>
            <button
              id="view-mode-week"
              onClick={() => onViewModeChange('week')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Week
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Scheduling Collateral & Discrepancy Button */}
            <button
              id="btn-collateral-panel"
              onClick={onOpenCollateralModal}
              title="Scheduling Collateral Buffer & Discrepancy Manager"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                overlapCount > 0
                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300 animate-pulse'
                  : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
              }`}
            >
              {overlapCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>
                    {overlapCount} Discrepanc{overlapCount === 1 ? 'y' : 'ies'}
                  </span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">Collateral:</span>
                  <span className="font-semibold">{collateral.bufferBankMinutes}m</span>
                </>
              )}
            </button>

            {/* Profile & Settings Button */}
            <button
              id="btn-profile"
              onClick={() => onOpenProfileModal('account')}
              title="User Profile, Settings & Account"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">Profile</span>
            </button>

            {/* PWA / Android Install Button */}
            <PWAInstallButton />

            {/* Sync Hub (Android Studio, Google Calendar & Outlook) */}
            <button
              id="btn-sync-hub"
              onClick={onOpenSyncModal}
              title="Android Studio & Calendar Sync"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden lg:inline">Sync</span>
            </button>

            {/* Camera Schedule Scanner */}
            <button
              id="btn-scan-schedule"
              onClick={onOpenScannerModal}
              title="Camera Schedule Scanner & OCR (Notes, Whiteboards, Agendas)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Scan Schedule</span>
            </button>

            {/* Primary Add Task Button */}
            <button
              id="btn-add-task-header"
              onClick={onOpenTaskModal}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs shadow-indigo-200 dark:shadow-none transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold">Add Task</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
