import { useState, useCallback } from 'react';
import { useEmergency } from '@/hooks/useEmergency';
import { QrCode, User, Phone, MapPin, AlertTriangle, Heart } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import type { Patient, EmergencyContact } from '@/lib/database.types';

export default function ScanPage() {
  const { fetchPatientByCode, triggerEmergency } = useEmergency();
  const [code, setCode] = useState('');
  const [patientInfo, setPatientInfo] = useState<{
    patient: Patient;
    contacts: EmergencyContact[];
    profile: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);

  const handleScan = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const result = await fetchPatientByCode(code.trim());
    if (result) {
      setPatientInfo(result);
    } else {
      setError('No patient found with this Emergency ID');
    }
    setLoading(false);
  }, [code, fetchPatientByCode]);

  const handleReportEmergency = useCallback(async () => {
    if (!patientInfo) return;
    setLoading(true);

    // Use browser location or fallback
    let lat = 28.6139, lng = 77.2090;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Use fallback location
      }
    }

    await triggerEmergency({
      patientId: patientInfo.patient.id,
      severity: 'critical',
      emergencyType: 'General',
      lat,
      lng,
      locationText: 'Reported via QR scan',
    });

    setEmergencyTriggered(true);
    setLoading(false);
  }, [patientInfo, triggerEmergency]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <QrCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">SafeRide Alert</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Jeevan Setu — Emergency Identification</p>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto p-4 md:p-6 w-full space-y-5">
        {!patientInfo ? (
          <div className="space-y-5">
            <div className="text-center py-6">
              <QrCode className="w-16 h-16 text-primary/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Enter Emergency ID</h2>
              <p className="text-sm text-muted-foreground">
                Enter the Emergency ID from the vehicle's QR code to retrieve passenger information
              </p>
            </div>

            <GlassCard>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emergency ID Code</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. JS-2024-8847"
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-mono focus:outline-none focus:border-primary/40"
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                />
                <button
                  onClick={handleScan}
                  disabled={loading || !code.trim()}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? '...' : 'Lookup'}
                </button>
              </div>
              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}
            </GlassCard>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up">
            {emergencyTriggered && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Emergency reported successfully! Help is on the way.
              </div>
            )}

            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Passenger Information</h3>
                <StatusBadge severity="critical">Emergency</StatusBadge>
              </div>
              <div className="space-y-2 text-sm">
                <InfoRow label="Name" value={patientInfo.profile?.full_name || 'Unknown'} />
                <InfoRow label="Emergency ID" value={patientInfo.patient.emergency_id_code} />
                <InfoRow label="Blood Group" value={patientInfo.patient.blood_group || 'Not specified'} />
                <InfoRow label="Allergies" value={patientInfo.patient.allergies || 'None'} />
                <InfoRow label="Medical Conditions" value={patientInfo.patient.medical_conditions || 'None'} />
                <InfoRow label="Gender" value={patientInfo.patient.gender || 'Not specified'} />
              </div>
            </GlassCard>

            {patientInfo.contacts.length > 0 && (
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Emergency Contacts</h3>
                </div>
                <div className="space-y-2">
                  {patientInfo.contacts.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.relation}</div>
                      </div>
                      <a
                        href={`tel:${c.phone}`}
                        className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {!emergencyTriggered && (
              <button
                onClick={handleReportEmergency}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-destructive text-destructive-foreground font-bold text-base flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] shadow-lg disabled:opacity-50"
              >
                <AlertTriangle className="w-5 h-5" />
                {loading ? 'Reporting Emergency...' : 'Report Emergency for This Person'}
              </button>
            )}

            <button
              onClick={() => { setPatientInfo(null); setCode(''); setEmergencyTriggered(false); }}
              className="w-full py-3 rounded-xl bg-secondary border border-border text-muted-foreground text-sm font-medium"
            >
              Scan Another ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
