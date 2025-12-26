
import React, { useState } from 'react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onNavigate: (page: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = () => {
    // Mock user authentication
    onLogin({
      id: "u1",
      name: "Alex Creator",
      email: "alex@creator.com",
      avatar: "https://picsum.photos/seed/alex/200/200",
      credits: 450,
      plan: 'creator'
    });
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminUsername || !adminPassword) {
      setError("Please enter both username and password.");
      return;
    }

    // Mock admin credentials validation
    if (adminUsername === 'admin' && adminPassword === 'admin123') {
      onNavigate('admin');
    } else {
      setError("Invalid admin credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      
      <div className="w-full max-w-md p-10 rounded-[32px] glass border border-white/10 text-center shadow-2xl relative animate-fade-in">
        <div 
          className="flex items-center justify-center gap-3 mb-10 cursor-pointer group"
          onClick={() => {
            setIsAdminMode(false);
            onNavigate('landing');
          }}
        >
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white text-[28px]">auto_awesome</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-white">ViralThumb AI</span>
        </div>
        
        {!isAdminMode ? (
          <>
            <h2 className="text-3xl font-bold mb-3 text-white">Welcome back</h2>
            <p className="text-text-secondary text-sm mb-10">Sign in to your creative studio</p>
            
            <div className="space-y-4">
              <button 
                onClick={handleAuth}
                className="w-full h-14 bg-white text-black font-black text-sm rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-[0.98]"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Continue with Google
              </button>
              
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-white/5"></div>
                <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Email address"
                    className="w-full h-14 px-5 bg-surface border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-text-secondary/30 text-sm"
                  />
                </div>
                
                <button 
                  onClick={handleAuth}
                  className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black text-sm rounded-2xl shadow-neon transition-all active:scale-[0.98]"
                >
                  Sign In with Email
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <p className="text-xs text-text-secondary">
                Don't have an account? <span className="text-primary font-bold cursor-pointer hover:underline">Sign Up</span>
              </p>
              
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-white/20"></div>
                <button 
                  onClick={() => setIsAdminMode(true)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary hover:text-primary transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  Admin Portal
                </button>
                <div className="w-1 h-1 rounded-full bg-white/20"></div>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleAdminLoginSubmit} className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-3 text-white flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-primary">security</span>
              Admin Access
            </h2>
            <p className="text-text-secondary text-sm mb-8 italic">Authorized personnel only</p>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-2 ml-1">Username</label>
                <input 
                  type="text" 
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter admin ID"
                  className="w-full h-14 px-5 bg-surface border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-text-secondary/30 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary tracking-widest mb-2 ml-1">Password</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 px-5 bg-surface border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-text-secondary/30 text-sm"
                />
              </div>

              {error && (
                <p className="text-red-400 text-[11px] font-bold mt-2 animate-shake">{error}</p>
              )}
              
              <button 
                type="submit"
                className="w-full h-14 mt-6 bg-gradient-to-r from-primary to-indigo-600 hover:scale-105 text-white font-black text-sm rounded-2xl shadow-neon transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Authenticate Access
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <button 
                type="button"
                onClick={() => {
                  setIsAdminMode(false);
                  setError(null);
                }}
                className="text-xs font-bold text-text-secondary hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to User Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
