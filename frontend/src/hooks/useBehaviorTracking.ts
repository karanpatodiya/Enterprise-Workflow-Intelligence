import { useRef, useCallback, useEffect } from 'react';

export interface DetectionEvent {
  type: 'paste' | 'burst' | 'timing';
  timestamp: number;
  charCount?: number;
  questionId?: string;
}

export interface BehaviorSummary {
  pasteDetected: boolean;
  pasteCount: number;
  typingSpeedWpm: number | null;
  responseTimeMs: number | null;
  characterBurstCount: number;
  rawEvents: DetectionEvent[];
}

export function useBehaviorTracking(questionId: string) {
  const events = useRef<DetectionEvent[]>([]);
  const questionStartTime = useRef<number>(Date.now());
  const lastKeyTime = useRef<number>(0);
  const wordCount = useRef<number>(0);
  const typingStartTime = useRef<number | null>(null);
  const pasteCount = useRef<number>(0);
  const burstCount = useRef<number>(0);

  // Reset tracking when question changes
  useEffect(() => {
    events.current = [];
    questionStartTime.current = Date.now();
    lastKeyTime.current = 0;
    wordCount.current = 0;
    typingStartTime.current = null;
    pasteCount.current = 0;
    burstCount.current = 0;
  }, [questionId]);

  const onPaste = useCallback((e: Event) => {
    const clipboardEvent = e as ClipboardEvent;
    const pastedText = clipboardEvent.clipboardData?.getData('text') ?? '';
    pasteCount.current += 1;

    const event: DetectionEvent = {
      type: 'paste',
      timestamp: Date.now(),
      charCount: pastedText.length,
      questionId,
    };
    events.current.push(event);
  }, [questionId]);

  const onKeyDown = useCallback((_e: Event) => {
    const now = Date.now();
    if (typingStartTime.current === null) {
      typingStartTime.current = now;
    }
    lastKeyTime.current = now;
  }, []);

  const onInput = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const text = target.value ?? '';
    wordCount.current = text.split(/\s+/).filter(Boolean).length;
  }, []);

  // Detect character bursts (>20 chars added suddenly without many keystrokes)
  const checkBurst = useCallback((prevLength: number, newLength: number) => {
    if (newLength - prevLength > 20) {
      burstCount.current += 1;
      events.current.push({ type: 'burst', timestamp: Date.now(), charCount: newLength - prevLength, questionId });
    }
  }, [questionId]);

  const getSummary = useCallback((): BehaviorSummary => {
    const responseTimeMs = Date.now() - questionStartTime.current;
    const typingDurationMin = typingStartTime.current
      ? (lastKeyTime.current - typingStartTime.current) / 60000
      : null;
    const typingSpeedWpm =
      typingDurationMin && typingDurationMin > 0
        ? Math.round(wordCount.current / typingDurationMin)
        : null;

    return {
      pasteDetected: pasteCount.current > 0,
      pasteCount: pasteCount.current,
      typingSpeedWpm,
      responseTimeMs,
      characterBurstCount: burstCount.current,
      rawEvents: [...events.current],
    };
  }, []);

  return { onPaste, onKeyDown, onInput, checkBurst, getSummary };
}
