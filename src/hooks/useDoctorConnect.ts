import { useState, useEffect, useRef, useCallback } from 'react';

export type DoctorCallState = 'idle' | 'connecting' | 'connected' | 'ended';

const DOCTOR_NAMES = [
  'Dr. R. Mehta — Cardiology',
  'Dr. A. Khan — Emergency Medicine',
  'Dr. S. Gupta — Neurology',
  'Dr. P. Joshi — Orthopedics',
  'Dr. L. Nair — ICU',
];

export function useDoctorConnect() {
  const [callState, setCallState] = useState<DoctorCallState>('idle');
  const [doctorName, setDoctorName] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [speakerMode, setSpeakerMode] = useState(false);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  // Initiate call — simulates connection delay
  const initiateCall = useCallback(() => {
    if (callState !== 'idle') return;
    setCallState('connecting');
    setDoctorName(DOCTOR_NAMES[Math.floor(Math.random() * DOCTOR_NAMES.length)]);
    setCallDuration(0);
    setCurrentInstructionIndex(0);

    // Simulate connection delay (2-4 seconds)
    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      setCallState('connected');
    }, delay);
  }, [callState]);

  // End call
  const endCall = useCallback(() => {
    setCallState('ended');
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    setTimeout(() => setCallState('idle'), 2000);
  }, []);

  // Speak an instruction using TTS
  const speakInstruction = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = speakerMode ? 1 : 0.7;
    utterance.lang = 'en-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [speakerMode]);

  // Speak the next instruction in sequence
  const speakNextInstruction = useCallback((instructions: { instruction_text: string }[]) => {
    if (instructions.length === 0 || callState !== 'connected') return;

    const idx = currentInstructionIndex % instructions.length;
    speakInstruction(instructions[idx].instruction_text);
    setCurrentInstructionIndex(prev => prev + 1);
  }, [currentInstructionIndex, callState, speakInstruction]);

  // Toggle speaker mode
  const toggleSpeaker = useCallback(() => {
    setSpeakerMode(prev => !prev);
  }, []);

  // Format duration to mm:ss
  const formattedDuration = `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`;

  return {
    callState,
    doctorName,
    callDuration,
    formattedDuration,
    speakerMode,
    currentInstructionIndex,
    isSpeaking,
    ttsSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    initiateCall,
    endCall,
    speakInstruction,
    speakNextInstruction,
    toggleSpeaker,
  };
}
