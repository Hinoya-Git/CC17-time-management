import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Task, CollateralState, Discrepancy } from '../types';
import { formatTime12h, formatDuration, timeToMinutes } from '../utils/dateUtils';

interface CollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  collateral: CollateralState;
  discrepancies: Discrepancy[];
  tasks: Task[];
  selectedDate: string;
  onAutoResolveAll: () => void;
  onAddTime: (taskId: string, minutes: number) => void;
  onDropTime: (taskId: string, minutes: number) => void;
  onUpdateBufferBank: (newBufferMinutes: number) => void;
  onToggleAutoCascade: () => void;
}

export const CollateralModal: React.FC<CollateralModalProps> = ({
  isOpen,
  onClose,
  collateral,
  discrepancies,
  tasks,
  selectedDate,
  onAutoResolveAll,
  onAddTime,
  onDropTime,
  onUpdateBufferBank,
  onToggleAutoCascade,
}) => {
  const [activeTab, setActiveTab] = useState<'discrepancies' | 'buffer' | 'history'>('discrepancies');

  if (!isOpen) return null;

  const overlapDiscrepancies = discrepancies.filter((d) => d.type === 'overlap');
  const durationDiscrepancies = discrepancies.filter((d) => d.type === 'overrun' || d.type === 'underrun');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Scheduling Collateral & Discrepancies
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage buffer elasticity, add/drop time, and resolve conflicts
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

        {/* Collateral Metrics Strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Collateral Reserve
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {collateral.bufferBankMinutes}m
            </span>
            <span className="text-[10px] text-slate-400 block">Available buffer</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Discrepancies
            </span>
            <span
              className={`text-lg font-bold ${
                discrepancies.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
              }`}
            >
              {discrepancies.length}
            </span>
            <span className="text-[10px] text-slate-400 block">Active conflicts</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Auto-Cascade
            </span>
            <button
              onClick={onToggleAutoCascade}
              className={`mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                collateral.autoCascadeOnDiscrepancy
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              {collateral.autoCascadeOnDiscrepancy ? 'Enabled' : 'Disabled'}
            </button>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ripple shifts</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-950/20">
          <button
            onClick={() => setActiveTab('discrepancies')}
            className={`py-3 border-b-2 px-3 transition-colors ${
              activeTab === 'discrepancies'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Discrepancies ({discrepancies.length})
          </button>
          <button
            onClick={() => setActiveTab('buffer')}
            className={`py-3 border-b-2 px-3 transition-colors ${
              activeTab === 'buffer'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Buffer Pool & Settings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 px-3 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Adjustment Log ({collateral.adjustments.length})
          </button>
        </div>

        {/* Tab 1: Discrepancies Resolution */}
        {activeTab === 'discrepancies' && (
          <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
            {/* Auto-Resolve Banner */}
            {overlapDiscrepancies.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      {overlapDiscrepancies.length} Overlapping Conflicts on {selectedDate}
                    </h3>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      Tasks are competing for the same time slot. Auto-cascade shifts colliding tasks sequentially.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-auto-resolve-discrepancies"
                  onClick={onAutoResolveAll}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Cascade</span>
                </button>
              </div>
            )}

            {/* List of Discrepancies */}
            {discrepancies.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Zero Scheduling Discrepancies!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Your timeline has perfect continuity with no conflicting overlaps or unabsorbed overruns.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Overlaps */}
                {overlapDiscrepancies.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {d.diffMinutes}m Overlap
                        </span>
                        <span className="text-[11px] text-slate-500">{d.timeRange}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        "{d.taskTitle}" ⚔️ "{d.conflictingTaskTitle}"
                      </p>
                    </div>

                    {/* Quick Add / Drop Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onDropTime(d.taskId, 15)}
                        title="Drop 15m from first task"
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      >
                        <Minus className="w-3 h-3 text-rose-500" />
                        <span>Drop 15m</span>
                      </button>

                      <button
                        onClick={() => onAddTime(d.taskId, 15)}
                        title="Add 15m & ripple forward"
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add 15m</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Duration Variances */}
                {durationDiscrepancies.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            d.type === 'overrun'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {d.type === 'overrun' ? `+${d.diffMinutes}m Overrun` : `-${d.diffMinutes}m Saved`}
                        </span>
                        <span className="text-[11px] text-slate-500">{d.timeRange}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {d.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {d.type === 'overrun' ? (
                        <button
                          onClick={() => onDropTime(d.taskId, d.diffMinutes)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                        >
                          Absorb Overrun
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateBufferBank(collateral.bufferBankMinutes + d.diffMinutes)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                        >
                          Deposit Saved Time
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Buffer Pool & Elasticity Settings */}
        {activeTab === 'buffer' && (
          <div className="p-5 space-y-5 max-h-[420px] overflow-y-auto">
            {/* Buffer Bank Slider */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Collateral Buffer Pool
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dedicated flex time to absorb unexpected delays without breaking downstream meetings.
                  </p>
                </div>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {collateral.bufferBankMinutes} mins
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onUpdateBufferBank(Math.max(0, collateral.bufferBankMinutes - 15))}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={collateral.bufferBankMinutes}
                  onChange={(e) => onUpdateBufferBank(Number(e.target.value))}
                  className="flex-1 accent-amber-500"
                />

                <button
                  onClick={() => onUpdateBufferBank(collateral.bufferBankMinutes + 15)}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>0m (Tight)</span>
                <span>45m (Balanced)</span>
                <span>90m (Generous)</span>
                <span>180m (High Elasticity)</span>
              </div>
            </div>

            {/* Auto Cascade Rules */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Cascade Ripple Effect
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    When you add time to an active task, automatically push subsequent tasks forward.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={collateral.autoCascadeOnDiscrepancy}
                  onChange={onToggleAutoCascade}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: History Log */}
        {activeTab === 'history' && (
          <div className="p-5 max-h-[420px] overflow-y-auto">
            {collateral.adjustments.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No collateral adjustments recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {collateral.adjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            adj.action === 'add_time'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : adj.action === 'drop_time'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {adj.action.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {adj.taskTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{adj.note}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-mono">
                      {adj.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Scheduling collateral protects against discrepancy cascade failure.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
