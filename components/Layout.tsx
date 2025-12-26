
import React from 'react';
import { APP_NAME } from '../constants';

interface NavbarProps {
  onNavigate: (page: any) => void;
  variant?: 'landing' | 'app';
  user?: any;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, variant = 'landing', user }) => {
  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => onNavigate('landing')}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-white">auto_awesome</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">{APP_NAME}</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {variant === 'landing' ? (
          <>
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Features</a>
            <a href="#showcase" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Showcase</a>
            <button onClick={() => onNavigate('pricing')} className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Pricing</button>
          </>
        ) : (
          <>
            <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Dashboard</button>
            <button onClick={() => onNavigate('templates')} className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Library</button>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">{user.name}</p>
              <p className="text-[10px] text-primary">{user.credits} Credits</p>
            </div>
            <div 
              className="w-10 h-10 rounded-full bg-cover bg-center border border-white/10 cursor-pointer"
              style={{ backgroundImage: `url(${user.avatar})` }}
              onClick={() => onNavigate('dashboard')}
            />
          </div>
        ) : (
          <>
            <button onClick={() => onNavigate('login')} className="hidden md:block text-sm font-bold text-text-secondary hover:text-white transition-colors">Login</button>
            <button 
              onClick={() => onNavigate('login')}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-neon transition-all hover:scale-105"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export const Footer: React.FC<{onAdminClick?: () => void}> = ({onAdminClick}) => (
  <footer className="bg-surface py-12 border-t border-white/5">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onAdminClick}>
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
        </div>
        <span className="font-bold">{APP_NAME}</span>
      </div>
      <div className="flex gap-8 text-sm text-text-secondary">
        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
        <a href="#" className="hover:text-primary transition-colors">Terms</a>
        <a href="#" className="hover:text-primary transition-colors">Support</a>
      </div>
      <p className="text-sm text-text-secondary">© 2024 {APP_NAME}. All rights reserved.</p>
    </div>
  </footer>
);
