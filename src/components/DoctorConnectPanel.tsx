import { Phone, PhoneOff, Volume2, VolumeX, ChevronRight, Stethoscope, Waves } from "lucide-react";
import { useDoctorConnect } from "@/hooks/useDoctorConnect";
import { StatusBadge } from "@/components/StatusBadge";
import type { AssistInstruction } from "@/lib/database.types";

interface DoctorConnectPanelProps {
  active: boolean;
  instructions: (AssistInstruction & { done: boolean })[];
  onAutoInitiate?: boolean;
}

export function DoctorConnectPanel({ active, instructions, onAutoInitiate }: DoctorConnectPanelProps) {
  const {
    callState,
    doctorName,
    formattedDuration,
    speakerMode,
    currentInstructionIndex,
    isSpeaking,
    ttsSupported,
    initiateCall,
    endCall,
    speakNextInstruction,
    toggleSpeaker,
  } = useDoctorConnect();

  // Auto-initiate call when emergency becomes active
  if (onAutoInitiate && active && callState === 'idle') {
    // Slight delay to avoid immediate call
    setTimeout(() => initiateCall(), 1500);
  }

  if (!active) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
        <Stethoscope className="w-8 h-8 opacity-20" />
        <p className="text-sm">Doctor Connect will activate during emergencies</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Call Status Header */}
      {callState === 'idle' && (
        <button
          onClick={initiateCall}
          className="w-full py-3.5 rounded-xl bg-success text-success-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-[0.98] shadow-lg"
        >
          <Phone className="w-4 h-4" />
          Connect to Doctor
        </button>
      )}

      {callState === 'connecting' && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">Connecting...</div>
              <div className="text-xs text-muted-foreground">{doctorName}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {callState === 'connected' && (
        <div className="p-4 rounded-xl bg-success/5 border border-success/15 animate-fade-in-up">
          {/* Doctor info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-sm font-semibold">{doctorName}</div>
                <div className="flex items-center gap-2">
                  <StatusBadge severity="success">Connected</StatusBadge>
                  <span className="text-xs text-muted-foreground font-mono">{formattedDuration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Waveform indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-1 justify-center mb-3 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-success rounded-full animate-voice-wave"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    height: `${8 + Math.random() * 16}px`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Current instruction being read */}
          {instructions.length > 0 && currentInstructionIndex > 0 && (
            <div className="p-3 rounded-xl bg-card border border-border mb-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {isSpeaking ? '🔊 Speaking...' : '📋 Last Instruction'}
              </div>
              <div className="text-sm">
                {instructions[Math.min(currentInstructionIndex - 1, instructions.length - 1)]?.instruction_text}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => speakNextInstruction(instructions)}
              disabled={!ttsSupported || instructions.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-primary/10 border border-primary/15 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/15 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
              Next Instruction
            </button>
            <button
              onClick={toggleSpeaker}
              className={`p-2.5 rounded-xl border transition-all ${
                speakerMode
                  ? 'bg-warning/10 border-warning/20 text-warning'
                  : 'bg-secondary border-border text-muted-foreground'
              }`}
              title={speakerMode ? 'Speaker ON (Bystander Mode)' : 'Speaker OFF'}
            >
              {speakerMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={endCall}
              className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/15 text-destructive transition-all hover:bg-destructive/15"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* Speaker mode indicator */}
          {speakerMode && (
            <div className="mt-2 flex items-center gap-2 text-xs text-warning">
              <Waves className="w-3 h-3" />
              <span>Bystander Speaker Mode — Instructions playing on speaker</span>
            </div>
          )}
        </div>
      )}

      {callState === 'ended' && (
        <div className="p-3 rounded-xl bg-secondary border border-border text-center text-sm text-muted-foreground animate-fade-in-up">
          Call ended · {formattedDuration}
        </div>
      )}
    </div>
  );
}
