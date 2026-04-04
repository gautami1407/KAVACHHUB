import { useState } from 'react';
import { useAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Ambulance, Hospital, TrafficCone, LogIn, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import type { Role } from '@/lib/database.types';

const roles: { value: Role; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { value: 'patient', label: 'Patient / Public', icon: Heart, color: 'text-destructive', desc: 'Trigger SOS, track ambulance' },
  { value: 'ambulance', label: 'Ambulance Driver', icon: Ambulance, color: 'text-primary', desc: 'Receive alerts, navigate' },
  { value: 'hospital', label: 'Hospital Admin', icon: Hospital, color: 'text-success', desc: 'Manage beds, incoming patients' },
  { value: 'traffic', label: 'Traffic Controller', icon: TrafficCone, color: 'text-warning', desc: 'Monitor signals, corridors' },
];

const roleRoutes: Record<Role, string> = {
  patient: '/patient',
  ambulance: '/ambulance',
  hospital: '/hospital',
  traffic: '/traffic',
};

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err); setLoading(false); return; }

      // Fetch the actual profile role from DB to navigate correctly
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
        const pd = profileData as { role: string } | null;
        if (pd?.role) {
          navigate(roleRoutes[pd.role as Role]);
          setLoading(false);
          return;
        }
      }
      // Fallback to form role if profile fetch fails
      navigate(roleRoutes[role]);
      setLoading(false);
    } else {
      if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
      const { error: err } = await signUp(email, password, fullName, role);
      if (err) { setError(err); setLoading(false); return; }

      // For signup, navigate based on selected role (since we just created the profile with it)
      setTimeout(() => {
        navigate(roleRoutes[role]);
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Jeevan Setu</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Emergency Response Ecosystem</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Join Jeevan Setu'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? 'Sign in to access your dashboard' : 'Create your account to get started'}
            </p>
          </div>

          <div className="glass-card p-6">
            {/* Mode toggle */}
            <div className="flex rounded-xl bg-secondary p-1 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'signup' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary/40 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(r => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            role === r.value
                              ? 'border-primary/30 bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border bg-secondary/50 hover:border-primary/15'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${r.color} mb-1`} />
                          <div className="text-xs font-semibold">{r.label}</div>
                          <div className="text-[10px] text-muted-foreground">{r.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Jeevan Setu — Saving lives through technology
      </footer>
    </div>
  );
}
