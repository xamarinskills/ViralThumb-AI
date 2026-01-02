
import React, { useState, useEffect } from 'react';
import { Navbar, Footer } from '../components/Layout';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/ThemeProvider';

interface SettingsPageProps {
  user: User | null;
  onNavigate: (page: any) => void;
  onLogout?: () => void;
}

const SECTIONS = [
  { id: 'account', label: 'Account', icon: 'person' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'billing', label: 'Billing', icon: 'credit_card' },
  { id: 'credits', label: 'Credits Usage', icon: 'bolt' },
];

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onNavigate, onLogout }) => {
  const [activeSection, setActiveSection] = useState('account');
  const [darkMode, setDarkMode] = useState(true);
  const [uiAnimations, setUiAnimations] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [deleteShake, setDeleteShake] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setDarkMode(theme === 'dark');
  }, []);

  useEffect(() => {
    const score = (() => {
      let s = 0;
      if (newPassword.length >= 8) s++;
      if (/[A-Z]/.test(newPassword)) s++;
      if (/[a-z]/.test(newPassword)) s++;
      if (/[0-9]/.test(newPassword)) s++;
      if (/[^A-Za-z0-9]/.test(newPassword)) s++;
      return Math.min(4, s);
    })();
    setPasswordStrength(score);
  }, [newPassword]);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone immediately, but your data will be preserved for 30 days before permanent deletion.")) {
      return;
    }
  
    setIsDeleting(true);
    try {
      // 1. Soft delete in profiles
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
  
      if (error) throw error;
  
      // 2. Sign out
      if (onLogout) await onLogout();
      else await supabase.auth.signOut();
      
    } catch (err: any) {
      console.error("Error deleting account:", err);
      alert("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };
  
  // Scroll spy effect (simplified)
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    let ticking = false;
    const headerOffset = 160;
    const ids = SECTIONS.map(s => s.id);

    const computeActive = () => {
      const y = window.scrollY + headerOffset;
      let current = ids[0];
      for (let i = 0; i < ids.length; i++) {
        const el = document.getElementById(ids[i]);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) current = ids[i];
        else break;
      }
      if (current !== activeSection) setActiveSection(current);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          computeActive();
          ticking = false;
        });
      }
    };

    const onResize = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          computeActive();
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    computeActive();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [activeSection]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      <Navbar onNavigate={onNavigate} variant="app" user={user} onLogout={onLogout} activePage="settings" />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-12 pb-28 lg:pb-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
        
        {/* MOBILE TOP TABS */}
        <div className="lg:hidden w-full overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 sticky top-20 z-40 bg-background/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex gap-2 w-max">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                aria-current={activeSection === section.id ? 'true' : undefined}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  activeSection === section.id 
                    ? 'bg-primary text-white border-primary shadow-neon-sm' 
                    : 'bg-white/5 text-text-secondary border-transparent hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-24 h-fit gap-2">
          {SECTIONS.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              aria-current={activeSection === section.id ? 'true' : undefined}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeSection === section.id ? 'text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ x: 4 }}
            >
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeSidebar"
                  className="absolute inset-0 bg-primary/10 border-l-2 border-primary rounded-r-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              <span className={`material-symbols-outlined text-[20px] ${activeSection === section.id ? 'text-primary' : ''}`}>
                {section.icon}
              </span>
              <span className="relative z-10">{section.label}</span>
            </motion.button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col gap-12 min-w-0">
          
          {/* PAGE HEADER */}
          <motion.header 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <h1 className="text-3xl font-black mb-2 tracking-tight">Settings</h1>
            <p className="text-text-secondary">Manage your account settings and preferences.</p>
          </motion.header>

          {/* 1. ACCOUNT */}
          <Section id="account" title="Profile Details">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <motion.div 
                  className="relative w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-primary to-indigo-500"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img src={user?.avatar} alt="Profile" className="w-full h-full rounded-full border-2 border-background object-cover" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px]">edit</span>
                  </div>
                </motion.div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Display Name" defaultValue={user?.name || "Creator"} />
                  <InputGroup label="Email Address" defaultValue={user?.email || "user@viralthumb.ai"} readOnly />
                </div>
              </div>
              <div className="hidden lg:flex justify-end">
                <SaveButton />
              </div>
            </div>
          </Section>

          {/* MOBILE STICKY SAVE BUTTON */}
          <motion.div 
            className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-white/10 z-50 flex justify-between items-center"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 1 }}
          >
            <span className="text-xs text-text-secondary font-medium">Unsaved changes</span>
            <SaveButton />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-bold text-red-400 mb-1">Delete Account</h3>
              <p className="text-sm text-red-400/60">Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <motion.button 
              onClick={() => {
                setDeleteShake(true);
                setTimeout(() => setDeleteShake(false), 500);
                handleDeleteAccount();
              }}
              disabled={isDeleting}
              className={`px-6 py-2.5 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-colors text-sm whitespace-nowrap ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={isDeleting ? {} : { scale: 1.02, boxShadow: "0 0 15px rgba(239, 68, 68, 0.2)" }}
              animate={deleteShake ? { x: [0, -5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </motion.button>
          </motion.div>

          {/* 2. APPEARANCE */}
          <Section id="appearance" title="Appearance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-surface border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <span className="material-symbols-outlined">dark_mode</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Dark Mode</h3>
                    <p className="text-xs text-text-secondary">Easier on the eyes</p>
                  </div>
                </div> 
                 <Toggle 
                    checked={theme === 'dark'}
                    onChange={(v) => setTheme(v ? 'dark' : 'light')}
                    ariaLabel="Toggle theme"
                  />
              </div>
              <div className="p-6 rounded-3xl bg-surface border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <span className="material-symbols-outlined">animation</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">UI Animations</h3>
                    <p className="text-xs text-text-secondary">Enable smooth transitions</p>
                  </div>
                </div>
                <Toggle checked={uiAnimations} onChange={setUiAnimations} />
              </div>
              
              {/* Preview Card */}
              <div className="md:col-span-2 h-32 rounded-3xl bg-surface border border-white/5 relative overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 shadow-neon"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <p className="absolute bottom-4 text-xs text-white/20 font-mono uppercase tracking-widest">Preview</p>
              </div>
              
              {/* Theme Demo */}
              <div className="md:col-span-2 p-6 rounded-3xl bg-surface border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">Theme Demo</h3>
                    <p className="text-xs text-text-secondary">This panel reflects theme changes immediately.</p>
                  </div>
                  <Toggle 
                    checked={theme === 'dark'}
                    onChange={(v) => setTheme(v ? 'dark' : 'light')}
                    ariaLabel="Toggle theme"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-light border border-white/10">
                    <p className="text-sm font-bold">Card</p>
                    <p className="text-[10px] text-text-secondary">Background adapts to theme</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-light border border-white/10">
                    <input 
                      type="text" 
                      placeholder="Input example"
                      className="w-full h-10 px-3 bg-surface border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-light border border-white/10 flex items-center justify-between">
                    <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold">Primary</button>
                    <button className="px-4 py-2 rounded-lg bg-white text-black text-xs font-bold">Contrast</button>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* 3. NOTIFICATIONS */}
          <Section id="notifications" title="Notifications">
             <motion.div 
               className="space-y-4"
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true }}
               variants={{
                 hidden: { opacity: 0 },
                 visible: {
                   opacity: 1,
                   transition: {
                     staggerChildren: 0.1
                   }
                 }
               }}
             >
               <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                 <NotifRow 
                   icon="mail" color="text-blue-400" bg="bg-blue-500/10" 
                   title="Email Notifications" sub="Receive weekly digests" 
                   checked={emailNotif} onChange={setEmailNotif} 
                 />
               </motion.div>
               <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                 <NotifRow 
                   icon="campaign" color="text-orange-400" bg="bg-orange-500/10" 
                   title="Product Updates" sub="New features and improvements" 
                   checked={productUpdates} onChange={setProductUpdates} 
                 />
               </motion.div>
               <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                 <NotifRow 
                   icon="local_offer" color="text-green-400" bg="bg-green-500/10" 
                   title="Marketing" sub="Promotions and special offers" 
                   checked={marketing} onChange={setMarketing} 
                 />
               </motion.div>
             </motion.div>
          </Section>

          {/* 4. SECURITY */}
          <Section id="security" title="Security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm">Change Password</h3>
                  <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-text-secondary">Last changed: 3 months ago</span>
                </div>
                <InputGroup label="Current Password" type="password" defaultValue=".........." />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">New Password</label>
                    <div className="relative group">
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-12 px-4 bg-surface-light border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all text-white"
                      />
                      <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-yellow-400' : passwordStrength === 3 ? 'bg-primary' : 'bg-emerald-500'}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        aria-label="Password strength indicator"
                      />
                    </div>
                    <p className="text-[10px] text-text-secondary">
                      {passwordStrength <= 1 ? 'Weak' : passwordStrength === 2 ? 'Fair' : passwordStrength === 3 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                  <InputGroup label="Confirm New" type="password" />
                </div>
                <div className="flex justify-end pt-2">
                  <button className="text-xs font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">Update Password</button>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-surface border border-white/5 h-full">
                <h3 className="font-bold text-sm mb-4">Active Sessions</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="material-symbols-outlined text-text-secondary">laptop_mac</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Chrome on macOS</p>
                      <p className="text-[10px] text-text-secondary">New York, USA • 192.168.1.1</p>
                    </div>
                    <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 opacity-60">
                    <span className="material-symbols-outlined text-text-secondary">smartphone</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Safari on iPhone 14</p>
                      <p className="text-[10px] text-text-secondary">New York, USA • 192.168.1.1</p>
                    </div>
                    <span className="text-[10px] text-text-secondary">2h ago</span>
                  </div>
                  <button className="text-xs text-red-400 hover:text-red-300 hover:underline font-medium w-full text-center mt-4 transition-all">Log out of all other sessions</button>
                </div>
              </div>
            </div>
          </Section>

          {/* 5. SUBSCRIPTION */}
          <Section id="billing" title="Subscription">
              <div className="p-1 rounded-3xl bg-gradient-to-r from-white/5 to-white/10 mb-6">
              <div className="bg-surface rounded-[22px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Current Plan</span>
                    <span className="bg-green-500/10 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Active</span>
                  </div>
                  <h2 className="text-3xl font-black mb-2">Pro Creator</h2>
                  <p className="text-sm text-text-secondary max-w-sm">You have access to 4K export, priority generation, and 100 monthly credits.</p>
                </div>
                <div className="text-right flex flex-col items-end gap-4">
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-black">$29</span>
                     <span className="text-text-secondary">/mo</span>
                   </div>
                   <motion.button
                     onClick={() => onNavigate('pricing')}
                     className="px-6 py-2.5 bg-[length:200%_200%] bg-gradient-to-r from-primary via-purple-500 to-indigo-500 text-white font-black rounded-xl shadow-neon flex items-center gap-2"
                     whileHover={{ scale: 1.05, backgroundPosition: "100% 50%", boxShadow: "0 0 30px rgba(139, 92, 246, 0.6)" }}
                     whileTap={{ scale: 0.95 }}
                     transition={{ duration: 0.3 }}
                   >
                     Upgrade Plan <span className="material-symbols-outlined text-sm">arrow_forward</span>
                   </motion.button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-surface border border-white/5 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-sm">Payment Method</h3>
                   <button className="text-[10px] text-primary font-bold hover:underline">Edit</button>
                 </div>
                 <div className="flex items-center gap-4 bg-surface-light p-4 rounded-xl border border-white/5">
                   <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                     <div className="w-3 h-3 rounded-full bg-red-500 -mr-1 mix-blend-multiply"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500 mix-blend-multiply"></div>
                   </div>
                   <div>
                     <p className="text-xs font-bold">Mastercard ending in 4242</p>
                     <p className="text-[10px] text-text-secondary">Expires 12/26</p>
                   </div>
                 </div>
              </div>

              <div className="p-6 rounded-3xl bg-surface border border-white/5">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-sm">Invoice History</h3>
                   <button className="text-[10px] text-text-secondary hover:text-white">View All</button>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse flex items-center px-3 gap-3 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                      <div className="w-16 h-2 bg-white/10 rounded"></div>
                      <div className="flex-1"></div>
                      <div className="w-8 h-2 bg-white/10 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* 6. CREDITS USAGE */}
          <Section id="credits" title="Credits Usage">
            <CreditsCard user={user} onNavigate={onNavigate} />

            <div className="mt-8">
              <h3 className="font-bold text-sm mb-4">Usage History</h3>
              <div className="space-y-2">
                <UsageRow icon="image" title="Generated Thumbnail" time="Oct 24, 2023 • 2:30 PM" delta="-1 credit" />
                <UsageRow icon="autorenew" title="Regenerated Variant" time="Oct 24, 2023 • 2:35 PM" delta="-1 credit" />
                <UsageRow icon="add_circle" title="Monthly Allocation" time="Oct 01, 2023 • 12:00 AM" delta="+50 credits" green />
              </div>
              <button className="w-full py-4 mt-4 rounded-xl border border-white/5 border-dashed text-xs font-bold text-text-secondary hover:text-white hover:border-white/20 transition-all">
                View full history
              </button>
            </div>
          </Section>

          <div className="h-20" /> {/* Spacer */}
        </div>
      </main>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-32">
    <h2 className="text-xl font-bold mb-6">{title}</h2>
    {children}
  </section>
);

const InputGroup = ({ label, type = "text", defaultValue, readOnly }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{label}</label>
    <div className="relative group">
      <input 
        type={type} 
        defaultValue={defaultValue} 
        readOnly={readOnly}
        className={`w-full h-12 px-4 bg-surface-light border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : 'text-white'}`}
      />
      {!readOnly && <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />}
    </div>
  </div>
);

const Toggle = ({ checked, onChange, ariaLabel }: { checked: boolean; onChange: (v: boolean) => void; ariaLabel?: string }) => (
  <div 
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel || 'Toggle'}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!checked);
      }
    }}
    onClick={() => onChange(!checked)}
    className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 outline-none focus:ring-2 focus:ring-primary/50 border border-white/10 ${checked ? 'bg-primary' : 'bg-surface-light'}`}
  >
    <motion.div 
      className="w-6 h-6 rounded-full bg-white shadow-sm"
      layout
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      animate={{ x: checked ? 28 : 0 }}
    />
  </div>
);

const NotifRow = ({ icon, color, bg, title, sub, checked, onChange }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-white/5 hover:border-white/10 transition-colors group">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-text-secondary">{sub}</p>
      </div>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const UsageRow = ({ icon, title, time, delta, green }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-white/5 hover:border-primary/20 hover:bg-surface-light transition-all group">
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${green ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-text-secondary'}`}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div>
        <h4 className="text-sm font-bold">{title}</h4>
        <p className="text-[10px] text-text-secondary">{time}</p>
      </div>
    </div>
    <span className={`text-xs font-black ${green ? 'text-green-400' : 'text-white/60'}`}>{delta}</span>
  </div>
);

const SaveButton = () => {
  const [saving, setSaving] = useState(false);
  
  return (
    <motion.button
      onClick={() => {
        setSaving(true);
        setTimeout(() => setSaving(false), 2000);
      }}
      className="relative px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-neon transition-colors text-sm overflow-hidden"
      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" }}
      whileTap={{ scale: 0.98 }}
    >
      <span className={saving ? "opacity-0" : "opacity-100"}>Save Changes</span>
      {saving && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className="material-symbols-outlined text-sm"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            check
          </motion.span>
        </div>
      )}
    </motion.button>
  );
};

const CreditsCard = ({ user, onNavigate }: { user: User | null, onNavigate: (p: any) => void }) => {
  const PLAN_LIMITS: Record<string, number> = { free: 50, creator: 500, pro: 2000 };
  const total = PLAN_LIMITS[user?.plan || 'free'] || 50;
  const current = user?.credits || 0;
  const used = Math.max(0, total - current);
  const percent = Math.min(100, Math.round((used / total) * 100));
  
  let statusColor = "text-green-400 bg-green-500/10";
  let progressGradient = "from-green-400 to-emerald-500";
  
  if (percent >= 90) {
    statusColor = "text-red-400 bg-red-500/10";
    progressGradient = "from-red-500 to-orange-500";
  } else if (percent >= 70) {
    statusColor = "text-yellow-400 bg-yellow-500/10";
    progressGradient = "from-yellow-400 to-orange-500";
  } else if (percent >= 40) {
      statusColor = "text-primary bg-primary/10";
      progressGradient = "from-primary to-indigo-500";
  }

  return (
    <div className="p-8 rounded-3xl bg-surface border border-white/5 relative group">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 duration-300 pointer-events-none">
         <div className="bg-black/90 backdrop-blur border border-white/10 px-3 py-2 rounded-lg text-[10px] text-text-secondary max-w-[200px] shadow-xl">
           Credits renew on the 1st of every month. Unused credits do not rollover.
         </div>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
            <span className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Monthly Usage</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{used}</span>
              <span className="text-lg text-text-secondary font-bold">/ {total}</span>
            </div>
        </div>
        <div className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 ${statusColor}`}>
            {percent >= 90 && <span className="material-symbols-outlined text-[14px]">warning</span>}
            {percent}% Used
        </div>
      </div>
      
      <div className="h-4 bg-white/5 rounded-full overflow-hidden mb-4 relative" aria-label={`Credit usage: ${percent}%`}>
        <motion.div 
          className={`h-full bg-gradient-to-r ${progressGradient}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${percent}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
      
      <div className="flex justify-between items-center text-xs text-text-secondary">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/20"></span>
            <span>{current} credits remaining</span>
        </div>
        <button onClick={() => onNavigate('pricing')} className="text-primary hover:text-white transition-colors font-bold hover:underline">
            Buy more credits &rarr;
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
