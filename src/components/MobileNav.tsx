import React from 'react';
import {
  Calendar as CalendarIcon,
  Inbox,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  AlertTriangle,
  User,
  Camera,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: 'calendar' | 'backlog';
  onSelectTab: (tab: 'calendar' | 'backlog') => void;
  backlogCount: number;
  discrepancyCount: number;
  onOpenTaskModal: () => void;
  onOpenCollateralModal: () => void;
  onOpenProfileModal: () => void;
  onOpenSyncModal: () => void;
  onOpenScannerModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  backlogCount,
  discrepancyCount,
  onOpenTaskModal,
  onOpenCollateralModal,
  onOpenProfileModal,
  onOpenSyncModal,
  onOpenScannerModal,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around">
      {/* Calendar Tab */}
      <button
        id="mobile-nav-calendar"
        onClick={() => onSelectTab('calendar')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
          activeTab === 'calendar'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <CalendarIcon className="w-5 h-5" />
        <span className="text-[10px]">Calendar</span>
      </button>

      {/* Backlog Tab */}
      <button
        id="mobile-nav-backlog"
        onClick={() => onSelectTab('backlog')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-lg relative transition-colors ${
          activeTab === 'backlog'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <div className="relative">
          <Inbox className="w-5 h-5" />
          {backlogCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {backlogCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">Backlog</span>
      </button>

      {/* Center Floating Add Task Button */}
      <button
        id="mobile-nav-add"
        onClick={onOpenTaskModal}
        className="w-10 h-10 -mt-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-300 dark:shadow-none active:scale-95 transition-transform"
        title="Schedule Task"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Camera OCR Scanner Tab */}
      <button
        id="mobile-nav-scanner"
        onClick={onOpenScannerModal}
        className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        title="Scan Schedule from Camera"
      >
        <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Scan</span>
      </button>

      {/* Profile & Settings Tab */}
      <button
        id="mobile-nav-profile"
        onClick={onOpenProfileModal}
        className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-slate-500 dark:text-slate-400"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
};
