export type TaskCategory = 
  | 'deep_work'
  | 'meeting'
  | 'admin'
  | 'learning'
  | 'health'
  | 'personal'
  | 'urgent';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  date: string; // 'YYYY-MM-DD'
  startTime: string | null; // 'HH:mm' (null for unscheduled backlog tasks)
  duration: number; // in minutes (e.g. 15, 30, 45, 60, 90)
  actualDuration?: number; // actual minutes spent (for discrepancy tracking)
  completed: boolean;
  completedAt?: string;
  syncSource?: 'local' | 'google' | 'outlook';
  syncId?: string;
}

export interface CategoryMetadata {
  id: TaskCategory;
  label: string;
  badgeBg: string;
  badgeText: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  accentColor: string;
  iconName: string;
}

export type DiscrepancyType = 'overlap' | 'overrun' | 'underrun' | 'gap';

export interface Discrepancy {
  id: string;
  taskId: string;
  taskTitle: string;
  type: DiscrepancyType;
  conflictingTaskId?: string;
  conflictingTaskTitle?: string;
  diffMinutes: number;
  message: string;
  timeRange: string;
}

export interface CollateralAdjustment {
  id: string;
  taskId: string;
  taskTitle: string;
  action: 'add_time' | 'drop_time' | 'cascade_shift' | 'absorb_buffer';
  deltaMinutes: number;
  timestamp: string;
  note: string;
}

export interface CollateralState {
  bufferBankMinutes: number; // Available reserve pool (e.g. 60m)
  usedBufferMinutes: number;
  autoCascadeOnDiscrepancy: boolean;
  adjustments: CollateralAdjustment[];
}

export interface DailyReportData {
  date: string;
  totalScheduledMinutes: number;
  totalCompletedMinutes: number;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  productivityScore: number;
  topCategory: string;
  categoryBreakdown: Record<TaskCategory, { minutes: number; count: number; percentage: number }>;
  discrepancies: {
    totalCount: number;
    overrunMinutes: number;
    underrunMinutes: number;
    overlapCount: number;
    netDiscrepancyMinutes: number;
  };
  keyAccomplishments: string[];
  aiSummary?: {
    summary: string;
    strengths: string[];
    recommendations: string[];
    aiGenerated: boolean;
  };
}

export interface NotificationSettings {
  taskStartReminders: boolean;
  reminderMinutesBefore: number; // 5, 10, 15
  discrepancyAlerts: boolean;
  dailyMorningBriefing: boolean;
  dailyEveningSummary: boolean;
  soundEnabled: boolean;
}

export interface ActivitySettings {
  dailyFocusGoalHours: number; // e.g. 4 hours
  trackActualDuration: boolean;
  discrepancyThresholdMinutes: number; // e.g. 15
  showWeekends: boolean;
  autoArchiveCompleted: boolean;
}

export interface GoogleSyncSettings {
  enabled: boolean;
  targetCalendar: string; // 'primary' | 'work' | 'personal'
  syncDirection: 'two_way' | 'export_only' | 'import_only';
  syncIntervalMinutes: number; // 0 (instant), 15, 30, 60
  includeReminders: boolean;
  autoExportIcsFeed: boolean;
  lastSyncedAt?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  timezone: string;
  role: string;
  defaultDuration: number;
}

export interface ProfileConfig {
  profile: UserProfile;
  notifications: NotificationSettings;
  activity: ActivitySettings;
  googleSync: GoogleSyncSettings;
}

export interface DetectedScheduleItem {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  suggestedDate?: string;
  suggestedStartTime: string | null; // 'HH:mm' or null for backlog
  detectedTimeRaw?: string;
  duration: number; // minutes
  recognizedObject?: string;
  confidence: number; // 0 - 100
  selected: boolean;
  conflictWarning?: string;
}

export interface DetectedObjectInfo {
  label: string;
  description: string;
  confidence: number;
}

export interface CameraScanResult {
  detectedObjects: DetectedObjectInfo[];
  extractedTextRaw: string;
  detectedContext: string;
  suggestedDate?: string;
  items: DetectedScheduleItem[];
  aiModelUsed?: string;
  processingTimeMs?: number;
}

export type CalendarViewMode = 'day' | '3day' | 'week';
