
import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import GeneratorPage from './pages/GeneratorPage';
import TemplateLibrary from './pages/TemplateLibrary';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage';
import AdminDashboard from './pages/AdminDashboard';
import { User } from './types';
import { supabase, getOrCreateProfile, isSupabaseConfigured } from './services/supabase';

type Page = 'landing' | 'login' | 'dashboard' | 'generator' | 'templates' | 'pricing' | 'checkout' | 'success' | 'admin';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await syncProfile(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user && mounted) {
        await syncProfile(session.user);
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setCurrentPage('landing');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncProfile = async (supabaseUser: any) => {
    if (!supabaseUser) return;
    try {
      const profile = await getOrCreateProfile(supabaseUser);
      
      setUser({
        id: profile.id,
        name: profile.full_name || 'Creator',
        username: profile.username || 'guest',
        email: supabaseUser.email || profile.email,
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
        credits: profile.credits ?? 50,
        plan: profile.plan || 'free',
        role: profile.role || 'user'
      });

      setCurrentPage((prev) => (prev === 'login' || prev === 'landing' ? 'dashboard' : prev));
    } catch (err) {
      console.error("Critical Profile Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      setUser(null);
      setCurrentPage('landing');
    }
  };

  const handleMockLogin = (mockData?: any) => {
    setUser({
      id: mockData?.id || 'mock-user',
      name: mockData?.name || 'Creator Guest',
      username: mockData?.username || 'guest_creator',
      email: mockData?.email || 'guest@viralthumb.ai',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
      credits: 50,
      plan: 'free',
      role: 'user'
    });
    setCurrentPage('dashboard');
  };

  const navigate = (page: Page) => {
    if (page === 'admin' && user?.role !== 'admin' && isSupabaseConfigured) {
      alert("Access Denied: Administrator role required.");
      return;
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 relative mb-8">
           <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-neon"></div>
        </div>
        <h2 className="text-xl font-black mb-2 tracking-tight">Authenticating...</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Establishing Secure Session</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'landing': return <LandingPage onNavigate={navigate} />;
      case 'login': return <LoginPage onLogin={handleMockLogin} onNavigate={navigate} />;
      case 'dashboard': return <Dashboard user={user} onNavigate={navigate} onLogout={handleLogout} />;
      case 'generator': return <GeneratorPage user={user} onNavigate={navigate} onLogout={handleLogout} />;
      case 'templates': return <TemplateLibrary onNavigate={navigate} user={user} onLogout={handleLogout} />;
      case 'pricing': return <PricingPage onNavigate={navigate} user={user} onLogout={handleLogout} />;
      case 'checkout': return <CheckoutPage onNavigate={navigate} />;
      case 'success': return <SuccessPage onNavigate={navigate} />;
      case 'admin': return <AdminDashboard onNavigate={navigate} />;
      default: return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-background text-white selection:bg-primary selection:text-white">
      {renderPage()}
    </div>
  );
};

export default App;
