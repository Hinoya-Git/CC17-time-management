import React, { useState } from 'react';
import {
  X,
  User,
  Settings,
  Bell,
  Activity,
  Globe,
  Info,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Clock,
  BarChart3,
  Calendar as CalendarIcon,
  Flame,
} from 'lucide-react';
import { ProfileConfig, Task, CollateralState, TaskCategory } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatDuration, formatDayLabel, addDays } from '../utils/dateUtils';
import { generateDailyReport, formatReportMarkdown } from '../utils/reportEngine';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProfileConfig;
  onSaveConfig: (newConfig: ProfileConfig) => void;
  tasks: Task[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  collateral: CollateralState;
  initialTab?: 'account' | 'settings' | 'activity' | 'about';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  tasks,
  selectedDate,
  onDateChange,
  collateral,
  initialTab = 'account',
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'settings' | 'activity' | 'about'>(initialTab);
  const [settingsSubTab, setSettingsSubTab] = useState<'notifications' | 'activity' | 'googleSync'>('notifications');

  // Form states initialized from config
  const [name, setName] = useState(config.profile.name);
  const [email, setEmail] = useState(config.profile.email);
  const [timezone, setTimezone] = useState(config.profile.timezone);
  const [role, setRole] = useState(config.profile.role);
  const [defaultDuration, setDefaultDuration] = useState(config.profile.defaultDuration);

  // Settings states
  const [notifications, setNotifications] = useState(config.notifications);
  const [activitySettings, setActivitySettings] = useState(config.activity);
  const [googleSync, setGoogleSync] = useState(config.googleSync);

  // Status feedback
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Activity Report computation
  const report = generateDailyReport(tasks, selectedDate, collateral);
  const { dayName, formattedDate } = formatDayLabel(selectedDate);
  const [copiedReport, setCopiedReport] = useState(false);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    const updatedConfig: ProfileConfig = {
      profile: {
        name: name.trim() || 'Ian Charles',
        email: email.trim() || 'iancharles0608@gmail.com',
        timezone,
        role: role.trim() || 'Productivity Specialist',
        defaultDuration,
      },
      notifications,
      activity: activitySettings,
      googleSync: {
        ...googleSync,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    };

    onSaveConfig(updatedConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestGoogleSync = () => {
    setSyncingGoogle(true);
    setSyncMessage(null);
    setTimeout(() => {
      setSyncingGoogle(false);
      setSyncMessage('Google Calendar synchronized successfully! Target: ' + googleSync.targetCalendar);
      setTimeout(() => setSyncMessage(null), 3500);
    }, 1000);
  };

  const handleCopyFeedUrl = () => {
    const url = `${window.location.origin}/api/calendar.ics`;
    navigator.clipboard.writeText(url);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2000);
  };

  const handleCopyActivityReport = () => {
    const md = formatReportMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{name || 'User Profile'}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved!</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top-Level Tabs: Account | Settings | Activity | About */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          <button
            id="tab-profile-account"
            onClick={() => setActiveTab('account')}
            className={`py-3 border-b-2 px-3.5 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'account'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>

          <button
            id="tab-profile-settings"
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 px-3.5 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            id="tab-profile-activity"
            onClick={() => setActiveTab('activity')}
            className={`py-3 border-b-2 px-3.5 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </button>

          <button
            id="tab-profile-about"
            onClick={() => setActiveTab('about')}
            className={`py-3 border-b-2 px-3.5 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'about'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* ================= TAB 1: ACCOUNT ================= */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  User Account Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Role / Headline
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="America/Los_Angeles">Pacific Time (US & Canada) GMT-7</option>
                      <option value="America/Denver">Mountain Time GMT-6</option>
                      <option value="America/Chicago">Central Time GMT-5</option>
                      <option value="America/New_York">Eastern Time GMT-4</option>
                      <option value="Europe/London">London / Greenwich Mean Time GMT+0</option>
                      <option value="Europe/Paris">Central European Time GMT+1</option>
                      <option value="Asia/Tokyo">Tokyo / Japan Standard Time GMT+9</option>
                      <option value="Asia/Singapore">Singapore Standard Time GMT+8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Default Task Duration
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDefaultDuration(mins)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            defaultDuration === mins
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Privacy status */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      Local-First Client Storage
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      All your schedule data, collateral buffer history, and preferences are saved locally in your browser.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: SETTINGS (Notifications, Activity, Google Sync) ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Settings Sub-Tab Navigation */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
                <button
                  onClick={() => setSettingsSubTab('notifications')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    settingsSubTab === 'notifications'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notifications</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('activity')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    settingsSubTab === 'activity'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Activity</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('googleSync')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    settingsSubTab === 'googleSync'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Google Sync</span>
                </button>
              </div>

              {/* Sub-Section 1: Notifications Settings */}
              {settingsSubTab === 'notifications' && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span>Notification & Alert Preferences</span>
                  </h3>

                  <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {/* Task start reminder */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Upcoming Task Start Reminders
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Receive notifications prior to each scheduled time block.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={notifications.reminderMinutesBefore}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              reminderMinutesBefore: Number(e.target.value),
                            }))
                          }
                          className="text-xs py-1 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value={5}>5 mins before</option>
                          <option value={10}>10 mins before</option>
                          <option value={15}>15 mins before</option>
                        </select>
                        <input
                          type="checkbox"
                          checked={notifications.taskStartReminders}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              taskStartReminders: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Discrepancy Alerts */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Instant Discrepancy & Overlap Alerts
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Alert when overlapping collisions or schedule overruns are detected.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.discrepancyAlerts}
                        onChange={(e) =>
                          setNotifications((prev) => ({
                            ...prev,
                            discrepancyAlerts: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Morning Briefing */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Daily Morning Briefing (8:00 AM)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Summary of today's deep work blocks, meetings, and available collateral.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.dailyMorningBriefing}
                        onChange={(e) =>
                          setNotifications((prev) => ({
                            ...prev,
                            dailyMorningBriefing: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Evening Summary */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Daily Evening Progress Summary (6:00 PM)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Prompt to review completed tasks and generate automated day reports.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.dailyEveningSummary}
                        onChange={(e) =>
                          setNotifications((prev) => ({
                            ...prev,
                            dailyEveningSummary: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Sound FX */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Audio Feedback on Task Completion
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Play a subtle chime when completing a calendar task.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.soundEnabled}
                        onChange={(e) =>
                          setNotifications((prev) => ({
                            ...prev,
                            soundEnabled: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Section 2: Activity Settings */}
              {settingsSubTab === 'activity' && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Activity & Productivity Targets</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    {/* Daily Focus Goal */}
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Daily Deep Work Focus Goal
                        </span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                          {activitySettings.dailyFocusGoalHours} Hours / Day
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="0.5"
                        value={activitySettings.dailyFocusGoalHours}
                        onChange={(e) =>
                          setActivitySettings((prev) => ({
                            ...prev,
                            dailyFocusGoalHours: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-indigo-600"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Used to calculate your daily productivity efficiency score.
                      </span>
                    </div>

                    {/* Discrepancy sensitivity */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Discrepancy Sensitivity Threshold
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Flag duration overruns that exceed this threshold.
                        </span>
                      </div>
                      <select
                        value={activitySettings.discrepancyThresholdMinutes}
                        onChange={(e) =>
                          setActivitySettings((prev) => ({
                            ...prev,
                            discrepancyThresholdMinutes: Number(e.target.value),
                          }))
                        }
                        className="text-xs py-1 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value={10}>10 mins</option>
                        <option value={15}>15 mins (Recommended)</option>
                        <option value={30}>30 mins</option>
                      </select>
                    </div>

                    {/* Show Weekends */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Include Weekends in Week View
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Display Saturday and Sunday columns on calendar week view.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={activitySettings.showWeekends}
                        onChange={(e) =>
                          setActivitySettings((prev) => ({
                            ...prev,
                            showWeekends: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Section 3: Google Sync Settings */}
              {settingsSubTab === 'googleSync' && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        G
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Google Calendar Synchronization
                      </h3>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <input
                        type="checkbox"
                        checked={googleSync.enabled}
                        onChange={(e) =>
                          setGoogleSync((prev) => ({
                            ...prev,
                            enabled: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Sync Enabled</span>
                    </label>
                  </div>

                  {syncMessage && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{syncMessage}</span>
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Google Calendar
                      </label>
                      <select
                        value={googleSync.targetCalendar}
                        onChange={(e) =>
                          setGoogleSync((prev) => ({
                            ...prev,
                            targetCalendar: e.target.value,
                          }))
                        }
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="primary">Primary Calendar (iancharles0608@gmail.com)</option>
                        <option value="work">Work Schedule Calendar</option>
                        <option value="personal">Personal & Habits Calendar</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Sync Direction
                        </label>
                        <select
                          value={googleSync.syncDirection}
                          onChange={(e) =>
                            setGoogleSync((prev) => ({
                              ...prev,
                              syncDirection: e.target.value as any,
                            }))
                          }
                          className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="two_way">Two-Way (Import & Export)</option>
                          <option value="export_only">Export Only (TimeFlow → Google)</option>
                          <option value="import_only">Import Only (Google → TimeFlow)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Sync Frequency
                        </label>
                        <select
                          value={googleSync.syncIntervalMinutes}
                          onChange={(e) =>
                            setGoogleSync((prev) => ({
                              ...prev,
                              syncIntervalMinutes: Number(e.target.value),
                            }))
                          }
                          className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value={0}>Instant on change</option>
                          <option value={15}>Every 15 minutes</option>
                          <option value={60}>Hourly</option>
                          <option value={-1}>Manual only</option>
                        </select>
                      </div>
                    </div>

                    {/* Test sync & feed link */}
                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleTestGoogleSync}
                        disabled={syncingGoogle}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
                        <span>{syncingGoogle ? 'Syncing...' : 'Sync with Google Now'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyFeedUrl}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                      >
                        {copiedFeed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFeed ? 'Copied Calendar Feed!' : 'Copy iCal Web Feed URL'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: ACTIVITY (Progress & Reports) ================= */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Date switcher inside Activity */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Daily Activity Review
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {dayName}, {formattedDate}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDateChange(addDays(selectedDate, -1))}
                    className="px-2 py-1 text-xs rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => onDateChange(addDays(selectedDate, 1))}
                    className="px-2 py-1 text-xs rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Activity Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block">
                    Productivity
                  </span>
                  <span className="text-xl font-black text-indigo-950 dark:text-indigo-100">
                    {report.productivityScore}/100
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-0.5">
                    Flow rating
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Completion
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {report.completionRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {report.completedTasks} of {report.totalTasks} done
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tracked Time
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {formatDuration(report.totalCompletedMinutes)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Planned: {formatDuration(report.totalScheduledMinutes)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                    Collateral Net
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-amber-100">
                    {report.discrepancies.netDiscrepancyMinutes > 0 ? '+' : ''}
                    {report.discrepancies.netDiscrepancyMinutes}m
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">
                    {report.discrepancies.totalCount} discrepancy resolved
                  </span>
                </div>
              </div>

              {/* Category Focus Bar */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Category Focus Breakdown
                  </h4>
                  <span className="text-slate-500">
                    Top: <strong className="text-slate-800 dark:text-slate-200">{report.topCategory}</strong>
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
                  {(Object.keys(report.categoryBreakdown) as TaskCategory[]).map((cat) => {
                    const item = report.categoryBreakdown[cat];
                    if (item.percentage === 0) return null;
                    return (
                      <div
                        key={cat}
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: CATEGORIES[cat]?.accentColor || '#6366f1',
                        }}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  {(Object.keys(report.categoryBreakdown) as TaskCategory[]).map((cat) => {
                    const item = report.categoryBreakdown[cat];
                    if (item.count === 0) return null;
                    const meta = CATEGORIES[cat];
                    return (
                      <div key={cat} className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.accentColor }}
                        />
                        <span className="text-slate-600 dark:text-slate-400 truncate">{meta.label}:</span>
                        <span className="font-semibold text-slate-900 dark:text-white ml-auto">
                          {formatDuration(item.minutes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accomplishments */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Completed Accomplishments ({report.completedTasks})</span>
                </h4>
                {report.keyAccomplishments.length === 0 ? (
                  <p className="text-slate-400 py-2 italic">
                    No completed tasks recorded for this date yet.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {report.keyAccomplishments.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleCopyActivityReport}
                    className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReport ? 'Copied Markdown!' : 'Copy Daily Report Markdown'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: ABOUT ================= */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-tr from-indigo-50/70 to-violet-50/70 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    TimeFlow Calendar
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Interactive time management app featuring color-coded daily calendars, drag-and-drop scheduling, automated progress analytics, and scheduling collateral discrepancy buffering.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    v1.2.0 Production
                  </span>
                </div>
              </div>

              {/* Core Features */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Core Innovations & Architecture
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">
                      ⚡ Scheduling Collateral
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Contingency buffer pool to add/drop time and automatically cascade ripple downstream tasks to resolve scheduling discrepancies.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">
                      🎨 7 Color-Coded Domains
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Visual distinction across Deep Work, Meetings, Admin, Learning, Health, Personal, and Urgent tasks.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">
                      🔄 Google & Outlook Sync
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Standard RFC 5545 iCalendar (.ics) cross-device export and import with direct 1-click web compose links.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">
                      📱 Mobile & Tablet Responsive
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Optimized touch targets, collapsible backlog trays, and bottom navigation for seamless handheld use.
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Keyboard & Navigation Shortcuts
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Previous Day</span>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold">←</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Next Day</span>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold">→</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Drag to Snap</span>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold">15m</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Resize Task</span>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold">Bottom Grip</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'settings' ? 'Configure notifications, activity & Google sync' : 'Preferences saved to browser storage'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              id="btn-save-profile-settings"
              onClick={handleSaveAll}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs shadow-indigo-200 dark:shadow-none flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
