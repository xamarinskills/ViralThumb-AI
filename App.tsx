
import React, { useState } from 'react';
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

type Page = 'landing' | 'login' | 'dashboard' | 'generator' | 'templates' | 'pricing' | 'checkout' | 'success' | 'admin';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    navigate('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      case 'dashboard':
        return <Dashboard user={user} onNavigate={navigate} />;
      case 'generator':
        return <GeneratorPage user={user} onNavigate={navigate} />;
      case 'templates':
        return <TemplateLibrary onNavigate={navigate} />;
      case 'pricing':
        return <PricingPage onNavigate={navigate} />;
      case 'checkout':
        return <CheckoutPage onNavigate={navigate} />;
      case 'success':
        return <SuccessPage onNavigate={navigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-background text-white selection:bg-primary selection:text-white">
      {renderPage()}
    </div>
  );
};

export default App;
