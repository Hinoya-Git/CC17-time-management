import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Calendar as CalendarIcon,
  Download,
  Upload,
  ExternalLink,
  CheckCircle2,
  Smartphone,
  Laptop,
  Globe,
  Share2,
  FileText,
  Copy,
  Terminal,
  Cpu,
  Layers,
  Check,
  Play,
  Vibrate,
} from 'lucide-react';
import { Task } from '../types';
import {
  downloadICalendarFile,
  parseICalendarContent,
  createGoogleCalendarUrl,
  createOutlookCalendarUrl,
} from '../utils/calendarSync';
import { formatTime12h, formatDuration } from '../utils/dateUtils';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onImportTasks: (importedTasks: Partial<Task>[]) => void;
  selectedDate: string;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onImportTasks,
  selectedDate,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'cloud'>('android');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isAndroidBridgeAvailable, setIsAndroidBridgeAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detect if running inside Android Studio native WebView wrapper
    // @ts-expect-error AndroidBridge is injected via MainActivity.kt
    if (typeof window !== 'undefined' && Boolean(window.AndroidBridge)) {
      setIsAndroidBridgeAvailable(true);
    }
  }, []);

  if (!isOpen) return null;

  const scheduledTasks = tasks.filter((t) => t.startTime !== null);
  const todaysTasks = tasks.filter((t) => t.date === selectedDate && t.startTime !== null);

  const handleExportFullIcs = () => {
    downloadICalendarFile(tasks, `timeflow-calendar-${selectedDate}.ics`);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTestHaptic = () => {
    // @ts-expect-error AndroidBridge injected via MainActivity.kt
    if (window.AndroidBridge?.triggerHapticFeedback) {
      // @ts-expect-error AndroidBridge
      window.AndroidBridge.triggerHapticFeedback();
      // @ts-expect-error AndroidBridge
      window.AndroidBridge.showToast('Haptic feedback triggered via Android Bridge!');
    }
  };

  const handleNativeCalendarSync = (task: Task) => {
    // @ts-expect-error AndroidBridge injected via MainActivity.kt
    if (window.AndroidBridge?.openNativeCalendar && task.startTime) {
      const dateParts = task.date.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const [startHour, startMin] = task.startTime.split(':').map(Number);

      const startDate = new Date(year, month, day, startHour, startMin);
      const endDate = new Date(startDate.getTime() + task.duration * 60 * 1000);

      // @ts-expect-error AndroidBridge
      window.AndroidBridge.openNativeCalendar(
        startDate.getTime(),
        endDate.getTime(),
        task.title,
        task.description || `Category: ${task.category}`
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseICalendarContent(content, selectedDate);
        if (parsed.length > 0) {
          onImportTasks(parsed);
          setImportStatus(`Successfully imported ${parsed.length} tasks from calendar file!`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('No valid VEVENT records found in file.');
        }
      }
    };
    reader.readAsText(file);
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
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Calendar & Device Synchronization</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                  Android Studio Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync with Android Studio, physical devices, Google Calendar, and Microsoft Outlook
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 shrink-0 gap-2">
          <button
            id="tab-android-studio"
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'android'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Android Studio & Mobile Sync</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 px-1.5 py-0.2 rounded-md font-mono">
              Gradle
            </span>
          </button>

          <button
            id="tab-cloud-sync"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cloud'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Google & Outlook Cloud Sync</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {activeTab === 'android' ? (
            /* Android Studio Sync Content */
            <div className="space-y-4">
              
              {/* Android Studio Gradle Sync Status Box */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/10 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      🤖
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Android Studio Project Configured
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Pre-configured Gradle Kotlin DSL with Camera OCR permissions & native WebView
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                      AGP 8.7.3
                    </span>
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                      SDK 35 (Android 15)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Package ID</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      com.timemanagement.calendar
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gradle Wrapper</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      Gradle 8.10.2
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Camera Scanner</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Pre-Authorized
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Native Bridge</span>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                      {isAndroidBridgeAvailable ? '🟢 Connected' : 'Ready to Connect'}
                    </span>
                  </div>
                </div>
              </div>

              {/* How to Sync in Android Studio Step-by-Step */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>How to Open & Sync in Android Studio</span>
                </h4>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Open in Android Studio:</strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Launch Android Studio, select <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">File → Open</code>, and pick this project directory (or the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">android/</code> folder).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Click "Sync Project with Gradle Files":</strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Android Studio will automatically detect <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">settings.gradle.kts</code> and run Gradle Sync. Click the elephant <strong>Sync</strong> icon in the top toolbar if prompted.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Build & Run on Device or Emulator:</strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Press <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-mono">Shift + F10</kbd> or click <strong>Run 'app'</strong>. The APK installs with full camera access for schedule scanning!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Terminal Commands Helper */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Terminal & Build Shortcuts</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block">Build & Sync Assets to Android</span>
                      <code className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate block">
                        npm run sync:android
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopy('npm run sync:android', 'npm-sync')}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedKey === 'npm-sync' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block">Gradle Sync & Assemble Debug APK</span>
                      <code className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate block">
                        ./gradlew assembleDebug
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopy('./gradlew assembleDebug', 'gradle-build')}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copiedKey === 'gradle-build' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Native Android Bridge Actions (Active when inside Android Studio WebView) */}
              {isAndroidBridgeAvailable && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Live Android Native Bridge Active</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                      Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Running inside native Android Studio wrapper. You have direct access to device vibration, calendar provider, and system intents.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestHaptic}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Vibrate className="w-3.5 h-3.5" />
                      <span>Test Device Vibration</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Cloud Sync Content (Google & Outlook) */
            <div className="space-y-4">
              {/* Sync Provider Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Google Calendar Box */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          G
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          Google Calendar
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      Sync schedule seamlessly with Google Calendar on Android, Chrome, and iOS Google app.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 flex items-center gap-2">
                    <button
                      onClick={handleExportFullIcs}
                      className="flex-1 text-xs font-semibold py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .ICS</span>
                    </button>
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
                      title="Open Google Calendar"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Microsoft Outlook Box */}
                <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/20 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                          O
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          Microsoft Outlook / 365
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      Synchronize with Outlook on Windows, Mac, iOS Outlook app, and Outlook Web.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-sky-100 dark:border-sky-900/40 flex items-center gap-2">
                    <button
                      onClick={handleExportFullIcs}
                      className="flex-1 text-xs font-semibold py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .ICS</span>
                    </button>
                    <a
                      href="https://outlook.live.com/calendar"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="p-1.5 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg transition-colors"
                      title="Open Outlook Calendar"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Import External Calendar File */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Import Calendar from Google or Outlook
                    </h3>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics,text/calendar"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    id="btn-upload-ics"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload .ICS File</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Export your calendar from Google Calendar or Outlook and upload it here to visualize all events in TimeFlow!
                </p>
              </div>

              {/* Individual Tasks Direct 1-Click Sync Links */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Today's Scheduled Tasks Direct Sync</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {todaysTasks.length} task(s)
                  </span>
                </h3>

                {todaysTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No scheduled tasks for today.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {todaysTasks.map((task) => {
                      const googleUrl = createGoogleCalendarUrl(task);
                      const outlookUrl = createOutlookCalendarUrl(task);

                      return (
                        <div
                          key={task.id}
                          className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-900 dark:text-white truncate block">
                              {task.title}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatTime12h(task.startTime!)} ({formatDuration(task.duration)})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isAndroidBridgeAvailable && (
                              <button
                                onClick={() => handleNativeCalendarSync(task)}
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[10px] hover:bg-emerald-100 flex items-center gap-1"
                                title="Add directly to Android Device Calendar"
                              >
                                <span>+ Android</span>
                              </button>
                            )}
                            <a
                              href={googleUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px] hover:bg-blue-100 flex items-center gap-1"
                            >
                              <span>+ Google</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <a
                              href={outlookUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="px-2 py-1 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-semibold text-[10px] hover:bg-sky-100 flex items-center gap-1"
                            >
                              <span>+ Outlook</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'android' ? 'Android Studio Gradle Project v1.0.0' : 'RFC 5545 iCalendar standard'}
          </span>
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
