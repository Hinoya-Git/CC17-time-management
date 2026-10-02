import { Task } from '../types';
import { timeToMinutes, minutesToTime } from './dateUtils';

/**
 * Format a Date to UTC string for standard iCalendar (YYYYMMDDTHHMMSSZ)
 */
function toICalUtc(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(year, month - 1, day, hours, minutes);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate standard Google Calendar Web URL for a single task
 */
export function createGoogleCalendarUrl(task: Task): string {
  if (!task.startTime) return '';
  const [year, month, day] = task.date.split('-').map(Number);
  const [hours, minutes] = task.startTime.split(':').map(Number);
  
  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + task.duration * 60000);

  const startIso = start.toISOString().replace(/-|:|\.\d+/g, '');
  const endIso = end.toISOString().replace(/-|:|\.\d+/g, '');

  const text = encodeURIComponent(task.title);
  const details = encodeURIComponent(
    `${task.description || ''}\n\nCategory: ${task.category.toUpperCase()} | Priority: ${task.priority.toUpperCase()}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startIso}/${endIso}&details=${details}`;
}

/**
 * Generate standard Outlook Web Compose URL for a single task
 */
export function createOutlookCalendarUrl(task: Task): string {
  if (!task.startTime) return '';
  const [year, month, day] = task.date.split('-').map(Number);
  const [hours, minutes] = task.startTime.split(':').map(Number);
  
  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + task.duration * 60000);

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const subject = encodeURIComponent(task.title);
  const body = encodeURIComponent(
    `${task.description || ''}\n\nCategory: ${task.category} | Priority: ${task.priority}`
  );

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}&body=${body}`;
}

/**
 * Generate RFC 5545 compliant .ics (iCalendar) content
 * Fully recognized by Google Calendar, Outlook, Apple Calendar on iOS, Android, and Desktop
 */
export function generateICalendarContent(tasks: Task[], calendarName = 'My Schedule'): string {
  const scheduledTasks = tasks.filter((t) => t.startTime !== null);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Time Management Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const task of scheduledTasks) {
    const startUtc = toICalUtc(task.date, task.startTime!);
    const endMinutes = timeToMinutes(task.startTime!) + task.duration;
    const endTimeStr = minutesToTime(endMinutes);
    const endUtc = toICalUtc(task.date, endTimeStr);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@timemanagement.app`,
      `DTSTAMP:${toICalUtc(task.date, task.startTime!)}`,
      `DTSTART:${startUtc}`,
      `DTEND:${endUtc}`,
      `SUMMARY:${task.title.replace(/[,;]/g, '\\$&')}`,
      `DESCRIPTION:${(task.description || '').replace(/\n/g, '\\n')}`,
      `CATEGORIES:${task.category.toUpperCase()}`,
      `PRIORITY:${task.priority === 'high' ? 1 : task.priority === 'medium' ? 5 : 9}`,
      `STATUS:${task.completed ? 'COMPLETED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger browser file download for .ics
 */
export function downloadICalendarFile(tasks: Task[], filename = 'schedule.ics'): void {
  const content = generateICalendarContent(tasks);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse standard .ics text content into tasks array
 */
export function parseICalendarContent(icsText: string, targetDateFallback: string): Partial<Task>[] {
  const events: Partial<Task>[] = [];
  const lines = icsText.split(/\r\n|\n|\r/);
  
  let inEvent = false;
  let summary = '';
  let description = '';
  let dtStart = '';
  let dtEnd = '';
  let categories = '';

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      summary = '';
      description = '';
      dtStart = '';
      dtEnd = '';
      categories = '';
    } else if (line.startsWith('END:VEVENT')) {
      inEvent = false;
      if (summary) {
        // Parse date and time
        let date = targetDateFallback;
        let startTime: string | null = '09:00';
        let duration = 45;

        if (dtStart) {
          // Format could be: 20260915T093000Z or 20260915
          const match = dtStart.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
          if (match) {
            const [, y, m, d, h, min] = match;
            date = `${y}-${m}-${d}`;
            if (h && min) {
              startTime = `${h}:${min}`;
            }
          }
        }

        if (dtStart && dtEnd) {
          const matchStart = dtStart.match(/T(\d{2})(\d{2})/);
          const matchEnd = dtEnd.match(/T(\d{2})(\d{2})/);
          if (matchStart && matchEnd) {
            const sMin = parseInt(matchStart[1], 10) * 60 + parseInt(matchStart[2], 10);
            const eMin = parseInt(matchEnd[1], 10) * 60 + parseInt(matchEnd[2], 10);
            if (eMin > sMin) {
              duration = Math.min(360, eMin - sMin);
            }
          }
        }

        // Map category
        let category: Task['category'] = 'deep_work';
        const lowerCat = (categories + ' ' + summary).toLowerCase();
        if (lowerCat.includes('meet') || lowerCat.includes('sync') || lowerCat.includes('call')) {
          category = 'meeting';
        } else if (lowerCat.includes('gym') || lowerCat.includes('walk') || lowerCat.includes('lunch')) {
          category = 'health';
        } else if (lowerCat.includes('urgent') || lowerCat.includes('fix') || lowerCat.includes('asap')) {
          category = 'urgent';
        } else if (lowerCat.includes('study') || lowerCat.includes('read') || lowerCat.includes('learn')) {
          category = 'learning';
        } else if (lowerCat.includes('email') || lowerCat.includes('admin') || lowerCat.includes('plan')) {
          category = 'admin';
        }

        events.push({
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: summary,
          description: description || undefined,
          date,
          startTime,
          duration,
          category,
          priority: 'medium',
          completed: false,
          syncSource: icsText.includes('GOOGLE') ? 'google' : icsText.includes('MICROSOFT') ? 'outlook' : 'google',
        });
      }
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8).replace(/\\,/g, ',').replace(/\\;/g, ';');
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.substring(12).replace(/\\n/g, '\n');
      } else if (line.startsWith('DTSTART')) {
        const val = line.split(':')[1] || '';
        dtStart = val.trim();
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':')[1] || '';
        dtEnd = val.trim();
      } else if (line.startsWith('CATEGORIES:')) {
        categories = line.substring(11).trim();
      }
    }
  }

  return events;
}
