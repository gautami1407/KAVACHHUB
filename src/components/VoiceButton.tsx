import { Mic } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function VoiceButton({ onStatusChange }: { onStatusChange?: (listening: boolean) => void }) {
  const [listening, setListening] = useState(false);

  const toggle = () => {
    const next = !listening;
    setListening(next);
    onStatusChange?.(next);
    if (next) setTimeout(() => { setListening(false); onStatusChange?.(false); }, 4000);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative flex items-center gap-3 px-5 py-3 rounded-2xl font-medium transition-all duration-300 border",
        listening
          ? "bg-primary/20 border-primary/50 text-primary"
          : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
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
  );
}
