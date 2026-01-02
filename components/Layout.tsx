
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { APP_NAME } from '../constants';

interface NavbarProps {
  onNavigate: (page: any) => void;
  onLogout?: () => void;
  variant?: 'landing' | 'app';
  user?: any;
  activePage?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onLogout, variant = 'landing', user, activePage }) => {
  const navLockRef = React.useRef(false);
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <motion.div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-neon group-hover:shadow-neon-strong transition-all duration-300">
          <span className="material-symbols-outlined text-white">auto_awesome</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">{APP_NAME}</span>
      </motion.div>

      <div className="hidden md:flex items-center gap-8">
        {user ? (
          <>
            <NavItem onClick={() => onNavigate('dashboard')} label="Dashboard" isActive={activePage === 'dashboard'} />
            <NavItem onClick={() => onNavigate('generator')} label="Generator" isActive={activePage === 'generator'} />
            <NavItem onClick={() => onNavigate('templates')} label="Templates" isActive={activePage === 'templates'} />
            <NavItem onClick={() => onNavigate('history')} label="History" isActive={activePage === 'history'} />
          </>
        ) : (
          <>
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Features</a>
            <a href="#showcase" className="text-sm font-medium text-text-secondary hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Showcase</a>
            <button onClick={() => onNavigate('pricing')} className="text-sm font-medium text-text-secondary hover:text-white transition-colors hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Pricing</button>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white/90">{user.name}</p>
              <div className="flex items-center justify-end gap-1">
                <motion.span 
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.p 
                  key={user.credits}
                  initial={{ scale: 1.2, color: '#fff' }}
                  animate={{ scale: 1, color: 'var(--color-primary)' }}
                  className="text-[10px] text-primary font-black uppercase tracking-widest"
                >
                  {user.credits} Credits
                </motion.p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-10 h-10 rounded-full bg-cover bg-center border border-white/10 shadow-lg cursor-pointer"
                style={{ backgroundImage: `url(${user.avatar})` }}
                onClick={() => onNavigate('settings')}
                whileHover={{ scale: 1.1, borderColor: 'rgba(140, 37, 244, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              />
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  if (navLockRef.current) return;
                  navLockRef.current = true;
                  onNavigate('settings');
                  setTimeout(() => { navLockRef.current = false; }, 500);
                }}
                className="w-10 h-10 rounded-full bg-surface-light border border-white/5 flex items-center justify-center hover:bg-white/5 hover:text-white transition-colors group"
                title="Settings"
                aria-label="Settings"
                whileHover={{ rotate: 360 }}
                whileTap={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary group-hover:text-white transition-colors">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M20.5399 15.6599L19.4699 17.5199C19.1699 18.0499 18.5299 18.2599 17.9799 18.0099L15.9199 17.0699C15.4299 17.4399 14.8899 17.7499 14.3099 17.9799L13.9299 20.2199C13.8299 20.8199 13.3099 21.2499 12.6999 21.2499H10.5599C9.94993 21.2499 9.42993 20.8199 9.32993 20.2199L8.94993 17.9799C8.36993 17.7499 7.82993 17.4399 7.33993 17.0699L5.27993 18.0099C4.72993 18.2599 4.08993 18.0499 3.78993 17.5199L2.71993 15.6599C2.41993 15.1299 2.53993 14.4699 3.00993 14.0799L4.85993 12.5599C4.81993 12.3799 4.79993 12.1899 4.79993 11.9999C4.79993 11.8099 4.81993 11.6199 4.85993 11.4399L3.00993 9.91993C2.53993 9.52993 2.41993 8.86993 2.71993 8.33993L3.78993 6.47993C4.08993 5.94993 4.72993 5.73993 5.27993 5.98993L7.33993 6.92993C7.82993 6.55993 8.36993 6.24993 8.94993 6.01993L9.32993 3.77993C9.42993 3.17993 9.94993 2.74993 10.5599 2.74993H12.6999C13.3099 2.74993 13.8299 3.17993 13.9299 3.77993L14.3099 6.01993C14.8899 6.24993 15.4299 6.55993 15.9199 6.92993L17.9799 5.98993C18.5299 5.73993 19.1699 5.94993 19.4699 6.47993L20.5399 8.33993C20.8399 8.86993 20.7199 9.52993 20.2499 9.91993L18.3999 11.4399C18.4399 11.6199 18.4599 11.8099 18.4599 11.9999C18.4599 12.1899 18.4399 12.3799 18.3999 12.5599L20.2499 14.0799C20.7199 14.4699 20.8399 15.1299 20.5399 15.6599Z" fill="currentColor"/>
                </svg>
              </motion.button>
              <motion.button 
                onClick={onLogout}
                className="w-10 h-10 rounded-full bg-surface-light border border-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors group"
                title="Logout"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </motion.button>
              <motion.button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-surface-light border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors outline-none focus:ring-2 focus:ring-primary/50"
                title="Toggle Theme"
                aria-label="Toggle Theme"
                aria-pressed={theme === 'dark'}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => onNavigate('login')} className="hidden md:block text-sm font-bold text-text-secondary hover:text-white transition-colors">Login</button>
            <motion.button 
              onClick={() => onNavigate('login')}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-neon"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(140, 37, 244, 0.6)' }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
            <motion.button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-surface-light border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </motion.button>
          </>
        )}
      </div>
    </nav>
  );
};

const NavItem = ({ onClick, label, isActive }: { onClick: () => void; label: string; isActive?: boolean }) => (
  <motion.button 
    onClick={onClick} 
    className={`relative text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-text-secondary hover:text-white'}`}
    whileHover="hover"
  >
    {label}
    {isActive && (
      <motion.div 
        className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.8)]"
        layoutId="activeTab"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )}
    {!isActive && (
      <motion.div 
        className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"
        initial={{ scaleX: 0 }}
        variants={{ hover: { scaleX: 1 } }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    )}
  </motion.button>
);

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
