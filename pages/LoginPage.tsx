
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, isUsernameTaken, syncProfileRecord } from '../services/supabase';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onNavigate: (page: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      onLogin({ 
        id: 'mock-id', 
        name: fullName || 'Guest', 
        username: username || 'guest', 
        email, 
        credits: 50, 
        plan: 'free', 
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'guest'}`
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Validation
        if (!username || username.length < 3) throw new Error("Username must be at least 3 characters.");
        if (!fullName) throw new Error("Full Name is required.");
        
        // 2. Uniqueness check for username
        const taken = await isUsernameTaken(username);
        if (taken) throw new Error("That username is already taken.");

        // 3. Supabase Auth Signup
        // We store the profile details in metadata so our sync engine can recover them
        // if the immediate insertion fails (e.g. if email verification blocks the session).
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: fullName, 
              user_name: username 
            } 
          }
        });

        if (signUpError) throw signUpError;
        
        // 4. Atomic Profile Sync
        // If the session is available (email confirm off), we insert immediately.
        // If session is null, the user must verify first. The App.tsx listener will 
        // handle the insertion once they click the email link.
        if (authData.user && authData.session) {
          await syncProfileRecord(authData.user.id, email, username, fullName);
          alert("Registration successful! Entering the studio...");
        } else if (authData.user) {
          alert("Account created! Please check your email for a verification link to activate your studio.");
        }
      } else {
        // Sign In Flow
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Incorrect email or password.");
          }
          throw signInError;
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An unexpected error occurred during studio setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 font-sans relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />

      <div className="w-full max-w-md p-10 glass rounded-[48px] border border-white/5 text-center shadow-2xl relative animate-fade-in">
        {/* Branding Header */}
        <div className="flex flex-col items-center gap-4 mb-10 cursor-pointer group" onClick={() => onNavigate('landing')}>
          <div className="w-16 h-16 rounded-[22px] bg-primary flex items-center justify-center shadow-neon-strong group-hover:scale-105 transition-transform duration-500">
            <span className="material-symbols-outlined text-white text-[42px]">auto_awesome</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">ViralThumb</h1>
            <span className="text-[11px] text-text-secondary uppercase font-black tracking-[0.4em] opacity-80">Studio</span>
          </div>
        </div>

        {/* Auth Tab Switcher */}
        <div className="flex bg-[#0f0f12] p-2 rounded-[28px] mb-10 border border-white/5">
          <button 
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }} 
            className={`flex-1 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isSignUp ? 'bg-primary text-white shadow-neon' : 'text-text-secondary hover:text-white'}`}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }} 
            className={`flex-1 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${isSignUp ? 'bg-primary text-white shadow-neon' : 'text-text-secondary hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-left space-y-1.5">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  required 
                  className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white placeholder:text-text-secondary/40 outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all" 
                />
              </div>
              <div className="text-left space-y-1.5">
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white placeholder:text-text-secondary/40 outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all" 
                />
              </div>
            </div>
          )}
          
          <div className="text-left space-y-1.5">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white placeholder:text-text-secondary/40 outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all" 
            />
          </div>

          <div className="text-left space-y-1.5">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white placeholder:text-text-secondary/40 outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all" 
            />
          </div>

          {error && (
            <div className="py-2 px-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[11px] font-black animate-shake">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-16 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-neon transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
            ) : (
              <span className="text-sm tracking-[0.1em] uppercase">{isSignUp ? 'Register Studio' : 'Enter Studio'}</span>
            )}
          </button>
        </form>

        <p className="mt-10 text-[10px] text-text-secondary/50 font-black tracking-widest uppercase">
          By joining, you agree to ViralThumb AI's <br />
          <span className="text-text-secondary hover:text-white underline cursor-pointer transition-colors">Terms of Service</span>
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-8 py-2 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
             <p className="text-[10px] text-yellow-500 font-bold">⚠️ Supabase config missing. Running in Mock Mode.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
