import React, { useState, useEffect, useMemo } from 'react';
import { Task, CalendarViewMode, CollateralState, TaskCategory, ProfileConfig } from './types';
import { getInitialTasks } from './data/defaultTasks';
import { Navbar } from './components/Navbar';
import { CalendarGrid } from './components/CalendarGrid';
import { TaskTray } from './components/TaskTray';
import { TaskModal } from './components/TaskModal';
import { CollateralModal } from './components/CollateralModal';
import { ProfileModal } from './components/ProfileModal';
import { SyncModal } from './components/SyncModal';
import { CameraScannerModal } from './components/CameraScannerModal';
import { MobileNav } from './components/MobileNav';
import {
  detectDiscrepancies,
  addTimeToTask,
  dropTimeToTask,
  autoResolveAllDiscrepancies,
} from './utils/collateralEngine';
import { getTodayString, getDaysForView } from './utils/dateUtils';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const LOCAL_STORAGE_KEY_TASKS = 'timeflow_tasks_v1';
const LOCAL_STORAGE_KEY_COLLATERAL = 'timeflow_collateral_v1';
const LOCAL_STORAGE_KEY_PROFILE = 'timeflow_profile_v1';

const DEFAULT_PROFILE_CONFIG: ProfileConfig = {
  profile: {
    name: 'Ian Charles',
    email: 'iancharles0608@gmail.com',
    timezone: 'America/Los_Angeles',
    role: 'Productivity Specialist',
    defaultDuration: 45,
  },
  notifications: {
    taskStartReminders: true,
    reminderMinutesBefore: 10,
    discrepancyAlerts: true,
    dailyMorningBriefing: true,
    dailyEveningSummary: true,
    soundEnabled: true,
  },
  activity: {
    dailyFocusGoalHours: 4,
    trackActualDuration: true,
    discrepancyThresholdMinutes: 15,
    showWeekends: true,
    autoArchiveCompleted: false,
  },
  googleSync: {
    enabled: true,
    targetCalendar: 'primary',
    syncDirection: 'two_way',
    syncIntervalMinutes: 15,
    includeReminders: true,
    autoExportIcsFeed: true,
    lastSyncedAt: 'Just now',
  },
};

export default function App() {
  // Initialize tasks from localStorage or defaults
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved tasks:', e);
    }
    return getInitialTasks();
  });

  // Initialize Collateral buffer state
  const [collateral, setCollateral] = useState<CollateralState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_COLLATERAL);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved collateral state:', e);
    }
    return {
      bufferBankMinutes: 60,
      usedBufferMinutes: 0,
      autoCascadeOnDiscrepancy: true,
      adjustments: [
        {
          id: 'adj-init',
          taskId: 'task-2',
          taskTitle: 'Design Sprint & Product Sync',
          action: 'absorb_buffer',
          deltaMinutes: 15,
          timestamp: '10:15 AM',
          note: 'Sample 15m meeting overrun absorbed by collateral reserve pool',
        },
      ],
    };
  });

  // Initialize Profile & Settings config
  const [profileConfig, setProfileConfig] = useState<ProfileConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved profile config:', e);
    }
    return DEFAULT_PROFILE_CONFIG;
  });

  // Calendar view controls
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [mobileTab, setMobileTab] = useState<'calendar' | 'backlog'>('calendar');

  // Modal Dialogs state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [isCollateralModalOpen, setIsCollateralModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'account' | 'settings' | 'activity' | 'about'>('account');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to persist tasks:', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_COLLATERAL, JSON.stringify(collateral));
    } catch (e) {
      console.error('Failed to persist collateral:', e);
    }
  }, [collateral]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(profileConfig));
    } catch (e) {
      console.error('Failed to persist profile:', e);
    }
  }, [profileConfig]);

  // Derive days list for current view
  const daysInView = useMemo(() => {
    return getDaysForView(selectedDate, viewMode);
  }, [selectedDate, viewMode]);

  // Derive real-time discrepancies for the selected date
  const discrepancies = useMemo(() => {
    return detectDiscrepancies(tasks, selectedDate);
  }, [tasks, selectedDate]);

  // Unscheduled backlog task count
  const backlogCount = useMemo(() => {
    return tasks.filter((t) => t.startTime === null && !t.completed).length;
  }, [tasks]);

  // Handlers
  const handleTaskDrop = (taskId: string, targetDate: string, newStartTime: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              date: targetDate,
              startTime: newStartTime,
            }
          : t
      )
    );

    showToast(`Scheduled "${target.title}" at ${newStartTime}`, 'success');
  };

  const handleDurationChange = (taskId: string, newDuration: number) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, duration: newDuration } : t)));
  };

  const handleToggleComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
  };

  // Collateral Action: Add time
  const handleAddTime = (taskId: string, minutes: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = addTimeToTask(
      tasks,
      taskId,
      minutes,
      collateral.autoCascadeOnDiscrepancy,
      collateral
    );
    setTasks(result.updatedTasks);
    setCollateral(result.updatedCollateral);
    showToast(result.adjustment.note, 'info');
  };

  // Collateral Action: Drop time
  const handleDropTime = (taskId: string, minutes: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = dropTimeToTask(
      tasks,
      taskId,
      minutes,
      true, // pull following tasks forward
      collateral
    );
    setTasks(result.updatedTasks);
    setCollateral(result.updatedCollateral);
    showToast(result.adjustment.note, 'info');
  };

  // 1-Click Auto Resolve Discrepancies
  const handleAutoResolveDiscrepancies = () => {
    const result = autoResolveAllDiscrepancies(tasks, selectedDate, collateral);
    if (result.resolvedCount > 0) {
      setTasks(result.updatedTasks);
      setCollateral(result.updatedCollateral);
      showToast(
        `Auto-cascaded ${result.resolvedCount} overlapping tasks into clean consecutive slots!`,
        'success'
      );
    } else {
      showToast('No overlapping discrepancies detected on this date.', 'info');
    }
  };

  // Task Save (Add / Edit)
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (taskData.id) {
      // Update existing
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t)));
      showToast(`Updated "${taskData.title}"`, 'success');
    } else {
      // Create new
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'Untitled Task',
        description: taskData.description,
        category: taskData.category || 'deep_work',
        priority: taskData.priority || 'medium',
        date: taskData.date || selectedDate,
        startTime: taskData.startTime !== undefined ? taskData.startTime : '09:00',
        duration: taskData.duration || 45,
        actualDuration: taskData.actualDuration,
        completed: false,
        syncSource: 'local',
      };
      setTasks((prev) => [newTask, ...prev]);
      showToast(`Added "${newTask.title}" to schedule`, 'success');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setIsTaskModalOpen(false);
    showToast('Task removed from schedule', 'info');
  };

  const handleQuickAddBacklog = (title: string, category: TaskCategory, duration: number) => {
    const newTask: Task = {
      id: `task-backlog-${Date.now()}`,
      title,
      category,
      priority: 'medium',
      date: selectedDate,
      startTime: null,
      duration,
      completed: false,
      syncSource: 'local',
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast(`Added "${title}" to backlog tray`, 'success');
  };

  const handleScheduleTaskQuick = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleImportTasks = (importedTasks: Partial<Task>[]) => {
    const completeTasks: Task[] = importedTasks.map((item, idx) => ({
      id: item.id || `imported-${Date.now()}-${idx}`,
      title: item.title || 'Imported Event',
      description: item.description,
      category: item.category || 'deep_work',
      priority: item.priority || 'medium',
      date: item.date || selectedDate,
      startTime: item.startTime || '10:00',
      duration: item.duration || 45,
      completed: false,
      syncSource: item.syncSource || 'google',
    }));

    setTasks((prev) => [...completeTasks, ...prev]);
    showToast(`Successfully imported ${completeTasks.length} events into your calendar!`, 'success');
  };

  const handleImportScannedTasks = (
    scannedTasks: Partial<Task>[],
    destination: 'calendar' | 'backlog'
  ) => {
    const completeTasks: Task[] = scannedTasks.map((item, idx) => ({
      id: `scanned-${Date.now()}-${idx}`,
      title: item.title || 'Scanned Task',
      description: item.description,
      category: item.category || 'deep_work',
      priority: item.priority || 'medium',
      date: item.date || selectedDate,
      startTime: destination === 'calendar' ? item.startTime || '09:00' : null,
      duration: item.duration || 45,
      completed: false,
      syncSource: 'local',
    }));

    setTasks((prev) => [...completeTasks, ...prev]);
    if (destination === 'calendar') {
      showToast(`Scheduled ${completeTasks.length} scanned tasks to calendar!`, 'success');
    } else {
      showToast(`Added ${completeTasks.length} scanned tasks to backlog tray!`, 'success');
    }
  };

  const handleSlotClick = (date: string, time: string) => {
    setEditingTask({
      date,
      startTime: time,
      duration: 45,
      category: 'deep_work',
      priority: 'medium',
    });
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        collateral={collateral}
        discrepancies={discrepancies}
        onOpenTaskModal={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onOpenCollateralModal={() => setIsCollateralModalOpen(true)}
        onOpenProfileModal={(tab) => {
          setProfileInitialTab(tab || 'account');
          setIsProfileModalOpen(true);
        }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        userName={profileConfig.profile.name}
      />

      {/* Main Workspace (Calendar + Backlog Tray) */}
      <main className="flex-1 flex overflow-hidden relative pb-16 lg:pb-0">
        {/* Calendar View Grid */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            mobileTab === 'backlog' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <CalendarGrid
            days={daysInView}
            tasks={tasks}
            discrepancies={discrepancies}
            viewMode={viewMode}
            onTaskClick={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
            onAddTime={(taskId, mins, e) => handleAddTime(taskId, mins, e)}
            onDropTime={(taskId, mins, e) => handleDropTime(taskId, mins, e)}
            onTaskDrop={handleTaskDrop}
            onDurationChange={handleDurationChange}
            onSlotClick={handleSlotClick}
            onOpenDiscrepancyResolve={() => setIsCollateralModalOpen(true)}
          />
        </div>

        {/* Task Backlog Tray (Side-by-Side on Desktop, Tab on Mobile) */}
        <div className={`${mobileTab === 'backlog' ? 'flex flex-1' : 'hidden lg:flex'}`}>
          <TaskTray
            tasks={tasks}
            onTaskClick={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onQuickAddBacklog={handleQuickAddBacklog}
            onScheduleTaskQuick={handleScheduleTaskQuick}
            onOpenScannerModal={() => setIsScannerModalOpen(true)}
            isOpen={mobileTab === 'backlog'}
          />
        </div>
      </main>

      {/* Mobile Responsive Bottom Navigation */}
      <MobileNav
        activeTab={mobileTab}
        onSelectTab={setMobileTab}
        backlogCount={backlogCount}
        discrepancyCount={discrepancies.length}
        onOpenTaskModal={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onOpenCollateralModal={() => setIsCollateralModalOpen(true)}
        onOpenProfileModal={() => {
          setProfileInitialTab('account');
          setIsProfileModalOpen(true);
        }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
      />

      {/* Task Add / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        defaultDate={selectedDate}
      />

      {/* Scheduling Collateral & Discrepancy Modal */}
      <CollateralModal
        isOpen={isCollateralModalOpen}
        onClose={() => setIsCollateralModalOpen(false)}
        collateral={collateral}
        discrepancies={discrepancies}
        tasks={tasks}
        selectedDate={selectedDate}
        onAutoResolveAll={handleAutoResolveDiscrepancies}
        onAddTime={(taskId, mins) => handleAddTime(taskId, mins)}
        onDropTime={(taskId, mins) => handleDropTime(taskId, mins)}
        onUpdateBufferBank={(mins) =>
          setCollateral((prev) => ({ ...prev, bufferBankMinutes: mins }))
        }
        onToggleAutoCascade={() =>
          setCollateral((prev) => ({
            ...prev,
            autoCascadeOnDiscrepancy: !prev.autoCascadeOnDiscrepancy,
          }))
        }
      />

      {/* Profile, Settings, Account, Activity & About Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        config={profileConfig}
        onSaveConfig={(newConfig) => {
          setProfileConfig(newConfig);
          showToast('Profile & settings updated successfully!', 'success');
        }}
        tasks={tasks}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        collateral={collateral}
        initialTab={profileInitialTab}
      />

      {/* Google Calendar & Outlook Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        tasks={tasks}
        onImportTasks={handleImportTasks}
        selectedDate={selectedDate}
      />

      {/* Camera Schedule Scanner & OCR Modal */}
      <CameraScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        selectedDate={selectedDate}
        existingTasks={tasks}
        onImportTasks={handleImportScannedTasks}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
