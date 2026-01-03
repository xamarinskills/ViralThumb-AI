
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
import DiagnosticPage from './pages/DiagnosticPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { User } from './types';
import { supabase, getOrCreateProfile, isSupabaseConfigured } from './services/supabase';
import { BASE_PATH } from './constants';

type Page = 'landing' | 'login' | 'dashboard' | 'generator' | 'templates' | 'pricing' | 'checkout' | 'success' | 'admin' | 'diagnostic' | 'history' | 'settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkUser = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn("Auth check timeout - proceeding without session");
          setLoading(false);
        }
      }, 5000); // 5 second timeout

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (timeoutId) clearTimeout(timeoutId);

        if (error) {
          console.error("Session error:", error);
          // If session is broken (e.g. invalid refresh token), proactively sign out to clear state
          if (error.message.includes('refresh_token') || error.status === 400) {
            console.warn("Stale session detected - signing out");
            await supabase.auth.signOut();
          }
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          await syncProfile(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      }
    };

    const syncProfile = async (supabaseUser: any) => {
      if (!supabaseUser) {
        setLoading(false);
        return;
      }

      try {
        // PROACTIVE: Immediately set a basic user state so the UI can render
        // while we attempt to fetch the full profile.
        setUser({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || 'Creator',
          username: supabaseUser.user_metadata?.user_name || 'user',
          email: supabaseUser.email || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
          credits: 50,
          plan: 'free',
          role: 'user'
        });

        // Navigate to dashboard immediately if we were on landing/login
        setCurrentPage((prev) => (prev === 'login' || prev === 'landing' ? 'dashboard' : prev));

        // Attempt background profile sync with timeout
        const profilePromise = getOrCreateProfile(supabaseUser);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile sync timeout')), 5000)
        );

        const profile = await Promise.race([profilePromise, timeoutPromise]) as any;

        if (profile) {
          if (profile.is_deleted) {
            console.warn("User is soft-deleted. Logging out.");
            await supabase.auth.signOut();
            alert("This account has been deactivated.");
            return;
          }

          setUser({
            id: profile.id,
            name: profile.full_name || 'Creator',
            username: profile.username || 'user',
            email: supabaseUser.email || profile.email,
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
            credits: profile.credits ?? 50,
            plan: profile.plan || 'free',
            role: profile.role || 'user',
            is_deleted: profile.is_deleted,
            deleted_at: profile.deleted_at
          });
        }
      } catch (err: any) {
        console.warn("⚠️ Profile sync failed or timed out. Using fallback user state.", err.message);
        // We already set fallback state above, so we just log and continue
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth Event: ${event}`);
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user && mounted) {
        await syncProfile(session.user);
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setCurrentPage('landing');
        setLoading(false);
      } else if (event === 'INITIAL_SESSION' && !session && mounted) {
        // No session on initial load - stop loading
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);


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
    // Ensure consistent path handling with BASE_PATH
    // If page is landing, we use the BASE_PATH as is (which already includes trailing slash)
    const targetPath = page === 'landing' ? BASE_PATH : `${BASE_PATH}${page}`;
    window.history.pushState({}, '', targetPath);
    window.scrollTo(0, 0);
  };

  // Handle browser back/forward buttons and initial URL
  useEffect(() => {
    const handlePopState = () => {
      let pathStr = window.location.pathname;

      // Strip BASE_PATH if present
      if (pathStr.startsWith(BASE_PATH)) {
        pathStr = pathStr.substring(BASE_PATH.length);
      } else {
        // Fallback for cases where BASE_PATH might be missing the trailing slash in the URL
        const cleanBasePath = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH;
        if (pathStr.startsWith(cleanBasePath)) {
          pathStr = pathStr.substring(cleanBasePath.length);
        }
      }

      // Remove leading slash
      const path = pathStr.replace(/^\//, '') || 'landing';

      const validPages: Page[] = ['landing', 'login', 'dashboard', 'generator', 'templates', 'pricing', 'checkout', 'success', 'admin', 'diagnostic', 'history', 'settings'];

      if (validPages.includes(path as Page)) {
        setCurrentPage(path as Page);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Check initial URL on mount
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 relative mb-8">
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-neon"></div>
        </div>
        <h2 className="text-xl font-black mb-2 tracking-tight">Authenticating Studio...</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Checking Algorithm Access</p>
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
      case 'history': return <HistoryPage user={user} onNavigate={navigate} onLogout={handleLogout} />;
      case 'settings': return <SettingsPage user={user} onNavigate={navigate} onLogout={handleLogout} />;
      case 'pricing': return <PricingPage onNavigate={navigate} user={user} onLogout={handleLogout} />;
      case 'checkout': return <CheckoutPage onNavigate={navigate} />;
      case 'success': return <SuccessPage onNavigate={navigate} />;
      case 'admin': return <AdminDashboard onNavigate={navigate} />;
      case 'diagnostic': return <DiagnosticPage />;
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
