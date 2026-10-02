export const CALENDAR_START_HOUR = 6; // 06:00 AM
export const CALENDAR_END_HOUR = 23; // 11:00 PM
export const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR; // 17 hours
export const HOUR_HEIGHT_PX = 68; // Height in px for 1 hour

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(dateStr: string): { dayName: string; formattedDate: string; isToday: boolean } {
  // Parse dateStr safely without timezone drift
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const todayStr = getTodayString();
  const isToday = dateStr === todayStr;

  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return { dayName, formattedDate, isToday };
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function getDaysForView(centerDate: string, mode: 'day' | '3day' | 'week'): string[] {
  if (mode === 'day') {
    return [centerDate];
  }
  if (mode === '3day') {
    return [centerDate, addDays(centerDate, 1), addDays(centerDate, 2)];
  }
  // Week view: start from Monday of current week
  const [year, month, day] = centerDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const mondayStr = addDays(centerDate, -distanceToMonday);
  
  const weekDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(mondayStr, i));
  }
  return weekDays;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const bounded = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const h = Math.floor(bounded / 60);
  const m = Math.floor(bounded % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMin = String(m).padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function snapTo15Minutes(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export function getCurrentTimeMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
