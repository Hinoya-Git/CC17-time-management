import { Task, Discrepancy, CollateralState, CollateralAdjustment } from '../types';
import { timeToMinutes, minutesToTime, formatTime12h } from './dateUtils';

/**
 * Detect all scheduling discrepancies for a set of tasks on a given date.
 */
export function detectDiscrepancies(tasks: Task[], date: string): Discrepancy[] {
  const dayTasks = tasks
    .filter((t) => t.date === date && t.startTime !== null)
    .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));

  const discrepancies: Discrepancy[] = [];

  // 1. Detect Overlaps between adjacent and intersecting scheduled tasks
  for (let i = 0; i < dayTasks.length; i++) {
    const current = dayTasks[i];
    const currentStart = timeToMinutes(current.startTime!);
    const currentEnd = currentStart + current.duration;

    // Check against subsequent tasks
    for (let j = i + 1; j < dayTasks.length; j++) {
      const next = dayTasks[j];
      const nextStart = timeToMinutes(next.startTime!);
      const nextEnd = nextStart + next.duration;

      if (nextStart < currentEnd) {
        // Overlap detected!
        const overlapMinutes = Math.min(currentEnd, nextEnd) - nextStart;
        discrepancies.push({
          id: `overlap-${current.id}-${next.id}`,
          taskId: current.id,
          taskTitle: current.title,
          conflictingTaskId: next.id,
          conflictingTaskTitle: next.title,
          type: 'overlap',
          diffMinutes: overlapMinutes,
          timeRange: `${formatTime12h(next.startTime!)} - ${formatTime12h(minutesToTime(Math.min(currentEnd, nextEnd)))}`,
          message: `Overlaps with "${next.title}" by ${overlapMinutes} minutes.`,
        });
      } else {
        // Since array is sorted by start time, if next starts after current ends,
        // no subsequent task can start earlier than next
        break;
      }
    }

    // 2. Detect Duration Discrepancy (Actual vs Planned Duration)
    if (current.actualDuration !== undefined && current.actualDuration !== current.duration) {
      const diff = current.actualDuration - current.duration;
      if (diff > 0) {
        discrepancies.push({
          id: `overrun-${current.id}`,
          taskId: current.id,
          taskTitle: current.title,
          type: 'overrun',
          diffMinutes: diff,
          timeRange: `${formatTime12h(current.startTime!)} (${current.duration}m planned)`,
          message: `Overrun: Took ${current.actualDuration}m (+${diff}m longer than scheduled).`,
        });
      } else if (diff < 0) {
        discrepancies.push({
          id: `underrun-${current.id}`,
          taskId: current.id,
          taskTitle: current.title,
          type: 'underrun',
          diffMinutes: Math.abs(diff),
          timeRange: `${formatTime12h(current.startTime!)} (${current.duration}m planned)`,
          message: `Underrun: Finished in ${current.actualDuration}m (${Math.abs(diff)}m saved).`,
        });
      }
    }
  }

  return discrepancies;
}

/**
 * Add time to a task with optional cascade ripple effect on subsequent tasks.
 */
export function addTimeToTask(
  tasks: Task[],
  taskId: string,
  addedMinutes: number,
  cascadeRipple: boolean,
  collateralState: CollateralState
): { updatedTasks: Task[]; updatedCollateral: CollateralState; adjustment: CollateralAdjustment } {
  const targetTask = tasks.find((t) => t.id === taskId);
  if (!targetTask || targetTask.startTime === null) {
    return {
      updatedTasks: tasks,
      updatedCollateral: collateralState,
      adjustment: {
        id: `adj-${Date.now()}`,
        taskId,
        taskTitle: 'Unknown',
        action: 'add_time',
        deltaMinutes: addedMinutes,
        timestamp: new Date().toLocaleTimeString(),
        note: 'Task not found',
      },
    };
  }

  const targetStart = timeToMinutes(targetTask.startTime);
  const newDuration = targetTask.duration + addedMinutes;
  const newEnd = targetStart + newDuration;

  let updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, duration: newDuration } : t));

  let note = `Added ${addedMinutes}m to "${targetTask.title}".`;

  // If cascade ripple is requested, shift any subsequent tasks on the same day that collide
  if (cascadeRipple) {
    const dayTasks = updatedTasks
      .filter((t) => t.date === targetTask.date && t.startTime !== null && t.id !== taskId)
      .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));

    let shiftPointer = newEnd;
    let shiftedCount = 0;

    const shiftedTaskMap = new Map<string, Task>();

    for (const t of dayTasks) {
      const tStart = timeToMinutes(t.startTime!);
      if (tStart < shiftPointer && tStart >= targetStart) {
        // This task collides with the extended time; push it forward!
        const newStartMinutes = shiftPointer;
        shiftedTaskMap.set(t.id, {
          ...t,
          startTime: minutesToTime(newStartMinutes),
        });
        shiftPointer = newStartMinutes + t.duration;
        shiftedCount++;
      } else if (tStart >= shiftPointer) {
        shiftPointer = Math.max(shiftPointer, tStart + t.duration);
      }
    }

    if (shiftedCount > 0) {
      updatedTasks = updatedTasks.map((t) => shiftedTaskMap.get(t.id) || t);
      note += ` Cascade-shifted ${shiftedCount} downstream task(s) forward.`;
    }
  }

  // Record collateral buffer consumption
  const updatedCollateral: CollateralState = {
    ...collateralState,
    usedBufferMinutes: collateralState.usedBufferMinutes + addedMinutes,
    adjustments: [
      {
        id: `adj-${Date.now()}`,
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        action: 'add_time',
        deltaMinutes: addedMinutes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note,
      },
      ...collateralState.adjustments.slice(0, 49),
    ],
  };

  return {
    updatedTasks,
    updatedCollateral,
    adjustment: updatedCollateral.adjustments[0],
  };
}

/**
 * Drop time from a task with optional cascade pull on subsequent tasks or return to collateral buffer.
 */
export function dropTimeToTask(
  tasks: Task[],
  taskId: string,
  droppedMinutes: number,
  pullSubsequent: boolean,
  collateralState: CollateralState
): { updatedTasks: Task[]; updatedCollateral: CollateralState; adjustment: CollateralAdjustment } {
  const targetTask = tasks.find((t) => t.id === taskId);
  if (!targetTask || targetTask.startTime === null) {
    return {
      updatedTasks: tasks,
      updatedCollateral: collateralState,
      adjustment: {
        id: `adj-${Date.now()}`,
        taskId,
        taskTitle: 'Unknown',
        action: 'drop_time',
        deltaMinutes: -droppedMinutes,
        timestamp: new Date().toLocaleTimeString(),
        note: 'Task not found',
      },
    };
  }

  // Minimum task duration is 15 minutes
  const actualDrop = Math.min(droppedMinutes, Math.max(0, targetTask.duration - 15));
  if (actualDrop <= 0) {
    return {
      updatedTasks: tasks,
      updatedCollateral: collateralState,
      adjustment: {
        id: `adj-${Date.now()}`,
        taskId,
        taskTitle: targetTask.title,
        action: 'drop_time',
        deltaMinutes: 0,
        timestamp: new Date().toLocaleTimeString(),
        note: `Duration already at 15m minimum`,
      },
    };
  }

  const newDuration = targetTask.duration - actualDrop;
  let updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, duration: newDuration } : t));

  let note = `Dropped ${actualDrop}m from "${targetTask.title}" (freed collateral).`;

  if (pullSubsequent) {
    const targetStart = timeToMinutes(targetTask.startTime);
    const originalEnd = targetStart + targetTask.duration;
    const newEnd = targetStart + newDuration;

    // Find immediate follower that starts at or right around originalEnd
    const dayTasks = updatedTasks
      .filter((t) => t.date === targetTask.date && t.startTime !== null && t.id !== taskId)
      .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));

    let currentPush = newEnd;
    let pulledCount = 0;
    const pulledTaskMap = new Map<string, Task>();

    for (const t of dayTasks) {
      const tStart = timeToMinutes(t.startTime!);
      if (tStart >= originalEnd - 15 && tStart <= originalEnd + 30) {
        // Pull earlier
        pulledTaskMap.set(t.id, {
          ...t,
          startTime: minutesToTime(currentPush),
        });
        currentPush += t.duration;
        pulledCount++;
      }
    }

    if (pulledCount > 0) {
      updatedTasks = updatedTasks.map((t) => pulledTaskMap.get(t.id) || t);
      note += ` Pulled ${pulledCount} following task(s) forward.`;
    }
  }

  const updatedCollateral: CollateralState = {
    ...collateralState,
    bufferBankMinutes: collateralState.bufferBankMinutes + actualDrop,
    adjustments: [
      {
        id: `adj-${Date.now()}`,
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        action: 'drop_time',
        deltaMinutes: -actualDrop,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note,
      },
      ...collateralState.adjustments.slice(0, 49),
    ],
  };

  return {
    updatedTasks,
    updatedCollateral,
    adjustment: updatedCollateral.adjustments[0],
  };
}

/**
 * 1-Click Discrepancy Resolution:
 * Automatically resolves all overlapping scheduling discrepancies on a date
 * by cascading colliding tasks forward seamlessly.
 */
export function autoResolveAllDiscrepancies(
  tasks: Task[],
  date: string,
  collateralState: CollateralState
): { updatedTasks: Task[]; updatedCollateral: CollateralState; resolvedCount: number } {
  const dayTasks = tasks
    .filter((t) => t.date === date && t.startTime !== null)
    .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));

  if (dayTasks.length <= 1) {
    return { updatedTasks: tasks, updatedCollateral: collateralState, resolvedCount: 0 };
  }

  let resolvedCount = 0;
  const updatedMap = new Map<string, Task>();

  let previousEnd = timeToMinutes(dayTasks[0].startTime!) + dayTasks[0].duration;

  for (let i = 1; i < dayTasks.length; i++) {
    const current = dayTasks[i];
    const currentStart = timeToMinutes(current.startTime!);

    if (currentStart < previousEnd) {
      // Collision detected! Push current start to previousEnd
      const newStart = minutesToTime(previousEnd);
      updatedMap.set(current.id, {
        ...current,
        startTime: newStart,
      });
      previousEnd = previousEnd + current.duration;
      resolvedCount++;
    } else {
      previousEnd = Math.max(previousEnd, currentStart + current.duration);
    }
  }

  if (resolvedCount === 0) {
    return { updatedTasks: tasks, updatedCollateral: collateralState, resolvedCount: 0 };
  }

  const updatedTasks = tasks.map((t) => updatedMap.get(t.id) || t);

  const updatedCollateral: CollateralState = {
    ...collateralState,
    adjustments: [
      {
        id: `adj-${Date.now()}`,
        taskId: 'all',
        taskTitle: 'Schedule Overhaul',
        action: 'cascade_shift',
        deltaMinutes: 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: `Auto-resolved ${resolvedCount} scheduling discrepancies by cascading timeline.`,
      },
      ...collateralState.adjustments.slice(0, 49),
    ],
  };

  return { updatedTasks, updatedCollateral, resolvedCount };
}
