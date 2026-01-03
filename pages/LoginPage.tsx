
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, isUsernameTaken, syncProfileRecord } from '../services/supabase';
import { BASE_PATH } from '../constants';

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
        const cleanUsername = username.trim();
        const cleanFullName = fullName.trim();
        const cleanEmail = email.trim();
        
        if (!cleanUsername || cleanUsername.length < 3) throw new Error("Username must be at least 3 characters.");
        if (!cleanFullName) throw new Error("Full Name is required.");

        // 2. Uniqueness check for username
        const taken = await isUsernameTaken(cleanUsername);
        if (taken) {
          // Check if it's the current user
          const { data: { user } } = await supabase.auth.getUser();
          const currentUsername = user?.user_metadata?.username || user?.user_metadata?.user_name;
          
          if (user && currentUsername === cleanUsername) {
            throw new Error("You are already logged in with this username. Please refresh the page or go to Dashboard.");
          }
          throw new Error("That username is already taken.");
        }

        // 3. Supabase Auth Signup
        // Note: We always store metadata so App.tsx can recover if immediate DB insert fails.
        console.log("Attempting sign-up for:", cleanEmail);
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanFullName,
              user_name: cleanUsername
            },
            emailRedirectTo: `${window.location.origin}${BASE_PATH}`
          }
        });

        console.log("Sign-up response:", {
          user: authData?.user?.id,
          session: !!authData?.session,
          error: signUpError?.message
        });

        if (signUpError) {
          console.error("Sign-up error details:", signUpError);

          // Provide helpful error messages
          if (signUpError.message.includes('Email signups are disabled')) {
            throw new Error("Email signups are disabled. Please enable the Email provider in Supabase Dashboard → Authentication → Providers → Email");
          }

          if (signUpError.message.includes('rate limit') || signUpError.message.includes('rate_limit')) {
            throw new Error("Email rate limit exceeded. Please wait a few minutes, or disable email confirmation in Supabase Dashboard → Authentication → Providers → Email. You can also manually confirm users via SQL (see manually-confirm-users.sql)");
          }

          throw signUpError;
        }

        if (!authData.user) {
          throw new Error("Sign-up failed: No user data returned.");
        }

        // 4. Handle Session Presence
        if (authData.user && authData.session) {
          // Email confirmation is OFF, user is auto-confirmed and logged in
          console.log("User auto-confirmed, creating profile...");
          try {
            const profile = await syncProfileRecord(authData.user.id, email, username, fullName);
            console.log("Profile created successfully:", profile);
            // The auth state change listener in App.tsx will handle navigation to dashboard
            // Wait a moment for the state to propagate
            await new Promise(resolve => setTimeout(resolve, 500));
            // App.tsx will automatically navigate to dashboard via auth state change
          } catch (dbErr: any) {
            console.error("DB Sync error details:", dbErr);
            console.warn("DB Sync failed, but Auth was successful. App.tsx will retry.", dbErr.message);
            // Still allow - App.tsx will retry profile creation and navigate
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else if (authData.user) {
          // Email confirmation is ON - user created but not confirmed
          console.log("✅ User created successfully!");
          console.log("User ID:", authData.user.id);
          console.log("Email:", authData.user.email);
          console.log("Note: The database trigger should have created the profile automatically.");

          // Show success message and switch to login tab
          setError(null);
          setIsSignUp(false); // Switch to login tab
          setEmail(email); // Pre-fill email for login
          setPassword(''); // Clear password
          // Show success message in a user-friendly way
          setTimeout(() => {
            alert("Account created successfully! You can now log in with your email and password.");
          }, 100);
        }
      } else {
        // Sign In Flow
        console.log("Attempting to sign in...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Incorrect email or password.");
          }
          if (signInError.message.includes("Email not confirmed")) {
            throw new Error("Please verify your email address before logging in.");
          }
          throw signInError;
        }

        // Login successful - App.tsx auth state change listener will handle navigation to dashboard
        console.log("✅ Login successful! Navigating to dashboard...");
        // The auth state change in App.tsx will automatically navigate to dashboard
      }
    } catch (err: any) {
      console.error("Auth Screen Error:", err);
      setError(err.message || "An error occurred. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />

      <div className="w-full max-w-md p-10 glass rounded-[48px] border border-white/5 text-center shadow-2xl relative animate-fade-in">
        <div className="flex flex-col items-center gap-4 mb-10 cursor-pointer group" onClick={() => onNavigate('landing')}>
          <div className="w-16 h-16 rounded-[22px] bg-primary flex items-center justify-center shadow-neon-strong group-hover:scale-105 transition-transform duration-500">
            <span className="material-symbols-outlined text-white text-[42px]">auto_awesome</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">ViralThumb</h1>
            <span className="text-[11px] text-text-secondary uppercase font-black tracking-[0.4em] opacity-80">Studio</span>
          </div>
        </div>

        <div className="flex bg-surface p-2 rounded-[28px] mb-10 border border-white/5">
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

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white placeholder:text-text-secondary/40 outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white placeholder:text-text-secondary/40 outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              />
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white outline-none focus:ring-1 focus:ring-primary/50 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full h-14 px-5 bg-surface-light border border-white/5 rounded-2xl text-white outline-none focus:ring-1 focus:ring-primary/50 text-sm"
          />

          {error && (
            <div className="py-3 px-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[11px] font-black animate-shake flex flex-col gap-2">
              <p>{error}</p>
              {(error.includes("already taken") || error.includes("User already registered")) && (
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  className="text-white underline hover:opacity-80 transition-opacity text-[10px]"
                >
                  Already your account? Switch to Login
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-neon transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
            ) : (
              <span className="text-sm tracking-[0.1em] uppercase">{isSignUp ? 'Create My Studio' : 'Enter Studio'}</span>
            )}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-text-secondary font-bold">
          {isSignUp ? (
            <>Already have an account? <button onClick={() => setIsSignUp(false)} className="text-primary hover:underline font-black">LOGIN HERE</button></>
          ) : (
            <>Don't have an account? <button onClick={() => setIsSignUp(true)} className="text-primary hover:underline font-black">SIGN UP HERE</button></>
          )}
        </p>

        <p className="mt-6 text-[10px] text-text-secondary/50 font-black tracking-widest uppercase">
          By joining, you agree to ViralThumb AI's <br />
          <span className="text-text-secondary hover:text-white underline cursor-pointer">Terms of Service</span>
        </p>

        {isSupabaseConfigured && (
          <div className="mt-10 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.clear();
                window.location.reload();
              }}
              className="text-[9px] uppercase tracking-widest text-text-secondary/60 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              Reset Session & Force Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
