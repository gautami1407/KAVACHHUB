import { Mic } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onStatusChange?: (listening: boolean) => void;
  onEmergencyDetected?: (detected: boolean) => void;
}

const TRIGGER_WORDS = ["help", "emergency", "ambulance", "bachao", "madad", "sos"];

export function VoiceButton({ onStatusChange, onEmergencyDetected }: VoiceButtonProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: no speech API — just toggle UI
      setListening(true);
      onStatusChange?.(true);
      setTimeout(() => {
        setListening(false);
        onStatusChange?.(false);
      }, 4000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      onStatusChange?.(true);
    };

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);

      // Check for trigger words
      const lower = text.toLowerCase();
      const detected = TRIGGER_WORDS.some(word => lower.includes(word));
      if (detected && event.results[0].isFinal) {
        onEmergencyDetected?.(true);
        recognition.stop();
      }
    };

    recognition.onerror = () => {
      setListening(false);
      onStatusChange?.(false);
    };

    recognition.onend = () => {
      setListening(false);
      onStatusChange?.(false);
      setTranscript("");
    };

    recognition.start();
  }, [onStatusChange, onEmergencyDetected]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
    onStatusChange?.(false);
  }, [onStatusChange]);

  const toggle = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={toggle}
        className={cn(
          "relative flex items-center gap-3 px-5 py-3 rounded-2xl font-medium transition-all duration-300 border",
          listening
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
        )}
      >
        <Mic className="w-5 h-5" />
        {listening && (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full animate-voice-wave"
                style={{ animationDelay: `${i * 0.1}s`, height: 8 }}
              />
            ))}
          </div>
        )}
        <span className="text-sm">{listening ? "Listening…" : "Voice Command"}</span>
      </button>
      {listening && transcript && (
        <div className="text-xs text-muted-foreground italic">"{transcript}"</div>
      )}
      {!listening && (
        <div className="text-[10px] text-muted-foreground">
          Say "help" or "emergency" to trigger SOS
        </div>
      )}
    </div>
  );
}
