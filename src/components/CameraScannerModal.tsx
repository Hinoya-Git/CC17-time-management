import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  RotateCw,
  Zap,
  ZapOff,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  Tag,
  Copy,
  Check,
  RefreshCw,
  Layers,
  ArrowUpDown,
  FileText,
  ScanLine,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority, DetectedScheduleItem, CameraScanResult } from '../types';
import { CATEGORIES, CATEGORY_LIST } from '../utils/categories';
import { SAMPLE_PRESETS } from '../utils/sampleImages';
import { timeToMinutes } from '../utils/dateUtils';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  existingTasks: Task[];
  onImportTasks: (tasks: Partial<Task>[], destination: 'calendar' | 'backlog') => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  existingTasks,
  onImportTasks,
}) => {
  // Mode: 'camera' (live viewfinder) | 'processing' (AI scanning) | 'review' (result sorting)
  const [mode, setMode] = useState<'camera' | 'processing' | 'review'>('camera');
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('Initializing OCR scanner...');

  // Scan Results
  const [scanResult, setScanResult] = useState<CameraScanResult | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedScheduleItem[]>([]);
  const [targetDate, setTargetDate] = useState<string>(selectedDate);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync targetDate with selectedDate when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetDate(selectedDate);
    }
  }, [isOpen, selectedDate]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCameraPermission(true);

      // Check for torch/flashlight capability
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as any) : {};
      setHasTorchSupport(Boolean(capabilities.torch));
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
    }
  }, [facingMode]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Modal open / close lifecycle
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, startCamera, stopCamera]);

  // Toggle Flashlight/Torch
  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextState = !torchEnabled;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchEnabled(nextState);
    } catch (e) {
      console.error('Torch toggle failed:', e);
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture current frame from live video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    processImageWithAI(dataUrl);
  };

  // Upload photo from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      processImageWithAI(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Use a pre-generated sample document
  const handleSelectSample = (preset: typeof SAMPLE_PRESETS[0]) => {
    const dataUrl = preset.generateDataUrl();
    setCapturedImage(dataUrl);
    stopCamera();
    processImageWithAI(dataUrl);
  };

  // Send captured image to backend Gemini OCR & Object Recognition API
  const processImageWithAI = async (imageDataUrl: string) => {
    setMode('processing');
    setErrorMessage(null);
    setProcessingStatus('Detecting physical objects & layout...');

    const step1 = setTimeout(() => {
      setProcessingStatus('Performing Optical Character Recognition (OCR)...');
    }, 1200);

    const step2 = setTimeout(() => {
      setProcessingStatus('Structuring schedule items & detecting conflicts...');
    }, 2400);

    try {
      const response = await fetch('/api/scan-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          targetDate: targetDate,
          existingTasks: existingTasks.filter((t) => t.date === targetDate && t.startTime !== null),
        }),
      });

      clearTimeout(step1);
      clearTimeout(step2);

      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}`);
      }

      const result: CameraScanResult = await response.json();
      setScanResult(result);

      // Check conflicts against existing tasks on targetDate
      const evaluatedItems = evaluateConflicts(result.items, existingTasks, targetDate);
      setDetectedItems(evaluatedItems);
      setMode('review');
    } catch (err: any) {
      console.error('OCR analysis failed:', err);
      clearTimeout(step1);
      clearTimeout(step2);
      setErrorMessage(
        err.message || 'Failed to scan image. Please try again or check the camera alignment.'
      );
      setMode('review');
    }
  };

  // Helper to evaluate conflicts with existing tasks
  const evaluateConflicts = (
    items: DetectedScheduleItem[],
    calendarTasks: Task[],
    date: string
  ): DetectedScheduleItem[] => {
    const dayTasks = calendarTasks.filter((t) => t.date === date && t.startTime !== null);

    return items.map((item) => {
      if (!item.suggestedStartTime) {
        return { ...item, conflictWarning: undefined };
      }

      const itemStart = timeToMinutes(item.suggestedStartTime);
      const itemEnd = itemStart + item.duration;

      const conflict = dayTasks.find((t) => {
        if (!t.startTime) return false;
        const tStart = timeToMinutes(t.startTime);
        const tEnd = tStart + t.duration;
        return Math.max(itemStart, tStart) < Math.min(itemEnd, tEnd);
      });

      return {
        ...item,
        conflictWarning: conflict
          ? `Overlaps with "${conflict.title}" (${conflict.startTime} - ${formatMinutesToTime(
              timeToMinutes(conflict.startTime!) + conflict.duration
            )})`
          : undefined,
      };
    });
  };

  const formatMinutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Item modifications in review table
  const toggleItemSelection = (id: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectAll = (selected: boolean) => {
    setDetectedItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const updateItemField = (id: string, field: keyof DetectedScheduleItem, value: any) => {
    setDetectedItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return evaluateConflicts(updated, existingTasks, targetDate);
    });
  };

  // Sort chronologically by suggested start time
  const sortByTime = () => {
    setDetectedItems((prev) => {
      return [...prev].sort((a, b) => {
        if (!a.suggestedStartTime) return 1;
        if (!b.suggestedStartTime) return -1;
        return timeToMinutes(a.suggestedStartTime) - timeToMinutes(b.suggestedStartTime);
      });
    });
  };

  // Sort by priority (high -> medium -> low)
  const sortByPriority = () => {
    const priorityWeight: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
    setDetectedItems((prev) => {
      return [...prev].sort(
        (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]
      );
    });
  };

  // Copy raw OCR transcript
  const copyRawOcr = () => {
    if (!scanResult?.extractedTextRaw) return;
    navigator.clipboard.writeText(scanResult.extractedTextRaw);
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  // Handle final import
  const handleFinalImport = (destination: 'calendar' | 'backlog') => {
    const selected = detectedItems.filter((i) => i.selected);
    if (selected.length === 0) return;

    const tasksToImport: Partial<Task>[] = selected.map((item) => ({
      title: item.title,
      description: item.description || `Scanned from: ${item.recognizedObject || 'Camera capture'}`,
      category: item.category,
      priority: item.priority,
      date: targetDate,
      startTime: destination === 'calendar' ? item.suggestedStartTime || '09:00' : null,
      duration: item.duration || 45,
      completed: false,
      syncSource: 'local',
    }));

    onImportTasks(tasksToImport, destination);
    onClose();
  };

  // Reset to retake
  const handleRetake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setDetectedItems([]);
    setErrorMessage(null);
    setMode('camera');
    startCamera();
  };

  if (!isOpen) return null;

  const selectedCount = detectedItems.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="camera-scanner-modal"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-all"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Camera Schedule Scanner & OCR
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3" />
                  Multimodal AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Point camera at notes, whiteboards, or printed agendas to extract and schedule tasks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* =========================================================================
              MODE 1: LIVE CAMERA VIEWFINDER
             ========================================================================= */}
          {mode === 'camera' && (
            <div className="space-y-4">
              {/* Camera Viewport */}
              <div className="relative w-full aspect-video sm:aspect-[16/9] max-h-[460px] bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
                {hasCameraPermission === false ? (
                  <div className="text-center p-6 text-slate-300 max-w-sm">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Camera Access Unavailable
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Browser camera permissions are denied or this device has no camera available. You can upload an image file instead or try a sample document below.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
                      >
                        Retry Camera
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />

                    {/* High-tech Viewfinder Overlay */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/20 flex items-center justify-center">
                      {/* Corner Brackets */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />

                      {/* Central Document Target Frame */}
                      <div className="w-4/5 h-3/4 border border-dashed border-white/40 rounded-xl relative flex items-center justify-center">
                        <div className="absolute -top-3 bg-indigo-600/90 text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wide flex items-center gap-1 backdrop-blur-xs">
                          <ScanLine className="w-3 h-3" />
                          ALIGN DOCUMENT / NOTES INSIDE
                        </div>

                        {/* Animated Laser Scan Line */}
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_cyan] animate-pulse" />
                      </div>
                    </div>

                    {/* Camera Controls Overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {hasTorchSupport && (
                        <button
                          onClick={toggleTorch}
                          className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                            torchEnabled
                              ? 'bg-amber-500 text-white'
                              : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                          title="Toggle Flashlight / Torch"
                        >
                          {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        onClick={switchCamera}
                        className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                        title="Switch Camera (Front / Back)"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Floating Capture Button Bar */}
                    <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/20"
                        title="Upload existing image from device"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Upload Image</span>
                      </button>

                      {/* Giant Shutter Button */}
                      <button
                        id="btn-camera-capture"
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full bg-white/20 p-1.5 flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform"
                        title="Capture Photo"
                      >
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-indigo-50 text-indigo-600">
                          <Camera className="w-6 h-6" />
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Hidden file input for manual photo uploads */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Sample Documents for Instant 1-Click Testing */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      No paper on hand? Try sample scan presets:
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instant test cases
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectSample(preset)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {preset.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODE 2: SCANNING & OCR PROCESSING ANIMATION
             ========================================================================= */}
          {mode === 'processing' && (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
              {/* Image Preview with radar beam */}
              <div className="relative w-64 h-44 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-800 shadow-xl bg-slate-900">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured schedule"
                    className="w-full h-full object-cover opacity-70"
                  />
                )}
                {/* Scanning Radar Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-cyan-400/40 to-transparent animate-pulse" />
                <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_12px_cyan] animate-[bounce_2s_infinite]" />
              </div>

              <div className="space-y-2 max-w-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Gemini Multimodal Vision Engine
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {processingStatus}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recognizing objects, transcribing handwriting, extracting timestamps, and resolving potential schedule overlaps.
                </p>
              </div>

              {/* Progress Steps Indicator */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Object Detection
                </span>
                <span>→</span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Text OCR
                </span>
                <span>→</span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Schedule Sorting
                </span>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODE 3: RESULTS REVIEW & SCHEDULE SORTING
             ========================================================================= */}
          {mode === 'review' && (
            <div className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    onClick={handleRetake}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-md shrink-0"
                  >
                    Retake Photo
                  </button>
                </div>
              )}

              {/* Captured Image & Recognized Objects Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start gap-4">
                {capturedImage && (
                  <div className="w-full md:w-44 h-32 rounded-lg overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 bg-slate-900 relative">
                    <img
                      src={capturedImage}
                      alt="Scanned source"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRetake}
                      className="absolute bottom-1.5 right-1.5 px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-semibold rounded backdrop-blur-xs flex items-center gap-1 transition-colors"
                    >
                      <RotateCw className="w-3 h-3" /> Retake
                    </button>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Recognized Objects & Context
                      </h3>
                    </div>
                    {scanResult?.aiModelUsed && (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        Powered by: {scanResult.aiModelUsed}
                      </span>
                    )}
                  </div>

                  {/* Object Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult?.detectedObjects?.map((obj, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-xs"
                      >
                        <Tag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span>{obj.label}</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold">
                          {obj.confidence}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {scanResult?.detectedContext && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {scanResult.detectedContext}
                    </p>
                  )}

                  {/* Collapsible Verbatim OCR View */}
                  {scanResult?.extractedTextRaw && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowRawOcr(!showRawOcr)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {showRawOcr ? 'Hide Raw OCR Transcript' : 'View Verbatim OCR Transcript'}
                        {showRawOcr ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showRawOcr && (
                        <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                          <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                            {scanResult.extractedTextRaw}
                          </pre>
                          <button
                            onClick={copyRawOcr}
                            className="absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs flex items-center gap-1"
                            title="Copy transcript"
                          >
                            {copiedOcr ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span className="text-[10px]">{copiedOcr ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Target Date & Sorting Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Target Date:</span>
                  </div>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setTargetDate(e.target.value);
                        setDetectedItems((prev) => evaluateConflicts(prev, existingTasks, e.target.value));
                      }
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={sortByTime}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Sort by Time
                  </button>

                  <button
                    onClick={sortByPriority}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Sort by Priority
                  </button>

                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                  <button
                    onClick={() => selectAll(selectedCount < detectedItems.length)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {selectedCount < detectedItems.length ? 'Select All' : 'Deselect All'}
                  </button>
                </div>
              </div>

              {/* Schedule Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Parsed Schedule Items</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedCount} of {detectedItems.length} selected
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Review and adjust details before importing
                  </span>
                </div>

                {detectedItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No schedule items detected in this scan. Try scanning with better lighting or clearer text.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detectedItems.map((item) => {
                      const categoryMeta = CATEGORIES[item.category] || CATEGORIES.deep_work;
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            item.selected
                              ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                              : 'bg-slate-50/70 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => toggleItemSelection(item.id)}
                              className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />

                            {/* Item Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                {/* Editable Title */}
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateItemField(item.id, 'title', e.target.value)}
                                  className="flex-1 min-w-[200px] text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden px-1 py-0.5"
                                  placeholder="Task title..."
                                />

                                {/* Category Dropdown */}
                                <select
                                  value={item.category}
                                  onChange={(e) =>
                                    updateItemField(item.id, 'category', e.target.value as TaskCategory)
                                  }
                                  className="text-xs font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                >
                                  {CATEGORY_LIST.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {CATEGORIES[cat]?.label || cat}
                                    </option>
                                  ))}
                                </select>

                                {/* Priority Dropdown */}
                                <select
                                  value={item.priority}
                                  onChange={(e) =>
                                    updateItemField(item.id, 'priority', e.target.value as TaskPriority)
                                  }
                                  className="text-xs font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                >
                                  <option value="high">High Priority</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low Priority</option>
                                </select>
                              </div>

                              {/* Timing & Origin Bar */}
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                {/* Start Time input */}
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span className="text-[11px] text-slate-500">Start:</span>
                                  <input
                                    type="time"
                                    value={item.suggestedStartTime || ''}
                                    onChange={(e) =>
                                      updateItemField(
                                        item.id,
                                        'suggestedStartTime',
                                        e.target.value || null
                                      )
                                    }
                                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                                  />
                                </div>

                                {/* Duration input */}
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                  <span className="text-[11px] text-slate-500">Duration:</span>
                                  <select
                                    value={item.duration}
                                    onChange={(e) =>
                                      updateItemField(item.id, 'duration', Number(e.target.value))
                                    }
                                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                                  >
                                    <option value="15">15m</option>
                                    <option value="30">30m</option>
                                    <option value="45">45m</option>
                                    <option value="60">60m (1h)</option>
                                    <option value="75">75m</option>
                                    <option value="90">90m (1.5h)</option>
                                    <option value="120">120m (2h)</option>
                                  </select>
                                </div>

                                {item.recognizedObject && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                    Origin: {item.recognizedObject}
                                  </span>
                                )}

                                {item.detectedTimeRaw && (
                                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                                    Text: &ldquo;{item.detectedTimeRaw}&rdquo;
                                  </span>
                                )}
                              </div>

                              {/* Conflict Warning Badge if overlaps with existing calendar task */}
                              {item.conflictWarning && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                  <span>{item.conflictWarning}</span>
                                </div>
                              )}
                            </div>
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

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 flex-wrap gap-2">
          {mode === 'review' ? (
            <>
              <button
                onClick={handleRetake}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-750 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" /> Retake Photo
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="btn-import-backlog"
                  disabled={selectedCount === 0}
                  onClick={() => handleFinalImport('backlog')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Import into Backlog tray as unscheduled tasks"
                >
                  Import to Backlog Tray ({selectedCount})
                </button>

                <button
                  id="btn-schedule-calendar"
                  disabled={selectedCount === 0}
                  onClick={() => handleFinalImport('calendar')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  title="Schedule directly into daily calendar"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Schedule to Calendar ({selectedCount})
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Supports handwritten sticky notes, whiteboards, paper agendas, and documents.</span>
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
