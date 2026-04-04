import { useState, useEffect, useRef, useCallback } from 'react';

export type CrashDetectionState = 'monitoring' | 'detected' | 'countdown' | 'triggered' | 'unavailable';

const IMPACT_THRESHOLD = 30; // m/s² — high-G impact
const COUNTDOWN_SECONDS = 15;

export function useCrashDetection(onAutoTrigger: () => void) {
  const [state, setState] = useState<CrashDetectionState>('unavailable');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [supported, setSupported] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggeredRef = useRef(false);

  // Check API availability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      setSupported(true);
      setState('monitoring');
    } else {
      setSupported(false);
      setState('unavailable');
    }
  }, []);

  // Handle motion events
  useEffect(() => {
    if (!supported || state !== 'monitoring') return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

      if (magnitude > IMPACT_THRESHOLD) {
        setState('detected');
        // Short delay before starting countdown
        setTimeout(() => {
          setState('countdown');
          setCountdown(COUNTDOWN_SECONDS);
        }, 500);
      }
    };

    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const response = await (DeviceMotionEvent as any).requestPermission();
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          } else {
            setState('unavailable');
          }
        } catch {
          setState('unavailable');
        }
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [supported, state]);

  // Countdown timer
  useEffect(() => {
    if (state !== 'countdown') {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time's up — auto-trigger SOS
          if (!triggeredRef.current) {
            triggeredRef.current = true;
            setState('triggered');
            onAutoTrigger();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [state, onAutoTrigger]);

  // Cancel a detected crash (false positive)
  const cancelCrash = useCallback(() => {
    setState('monitoring');
    setCountdown(COUNTDOWN_SECONDS);
    triggeredRef.current = false;
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Reset after emergency is handled
  const reset = useCallback(() => {
    setState('monitoring');
    setCountdown(COUNTDOWN_SECONDS);
    triggeredRef.current = false;
  }, []);

  // Simulate crash for demo/presentation
  const simulateCrash = useCallback(() => {
    if (state === 'monitoring') {
      setState('detected');
      setTimeout(() => {
        setState('countdown');
        setCountdown(COUNTDOWN_SECONDS);
      }, 500);
    }
  }, [state]);

  return {
    state,
    countdown,
    supported,
    cancelCrash,
    reset,
    simulateCrash,
  };
}
