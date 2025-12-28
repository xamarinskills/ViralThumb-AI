
import React from 'react';
import { Navbar, Footer } from '../components/Layout';
import { User } from '../types';

// Add user and onLogout to the props interface
interface PricingPageProps {
  onNavigate: (page: any) => void;
  user?: User | null;
  onLogout?: () => void;
}

// Destructure new props and pass them to Navbar
const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        onNavigate={onNavigate} 
        user={user} 
        onLogout={onLogout} 
        variant={user ? 'app' : 'landing'} 
      />
      
      <main className="flex-1 flex flex-col items-center py-20 px-6">
        <header className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Simple Pricing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 text-glow">Viral Success</span>
          </h1>
          <p className="text-lg text-text-secondary">Choose the plan that fits your channel growth. Upgrade, downgrade, or cancel anytime.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full items-start">
          <PriceCard 
            name="Free" 
            price="₹0" 
            desc="Perfect for trying out the generator."
            features={["5 Generations per day", "Basic Templates", "Watermarked Images", "Standard Speed"]}
            onAction={() => onNavigate('login')}
            btnText="Start for Free"
          />
          <PriceCard 
            name="Creator" 
            price="₹1499" 
            desc="For consistent content creators."
            features={["Unlimited Generations", "No Watermark", "Premium Templates", "Fast Generation Speed", "Commercial License"]}
            popular
            onAction={() => onNavigate('checkout')}
            btnText="Get Creator"
          />
          <PriceCard 
            name="Pro" 
            price="₹3999" 
            desc="Power users and agencies."
            features={["Everything in Creator", "Bulk Generation (10x)", "Brand Presets & Fonts", "Priority Rendering (Instant)", "API Access"]}
            onAction={() => onNavigate('checkout')}
            btnText="Go Pro"
          />
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-50">
          <div className="flex items-center gap-2"><span className="material-symbols-outlined">lock</span> Secure Payment</div>
          <div className="flex items-center gap-2"><span className="material-symbols-outlined">currency_rupee</span> Indian Payments</div>
          <div className="flex items-center gap-2"><span className="material-symbols-outlined">support</span> 24/7 Support</div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const PriceCard = ({ name, price, desc, features, onAction, btnText, popular = false }: any) => (
  <div className={`p-10 rounded-3xl flex flex-col h-full transition-all duration-300 ${popular ? 'bg-surface-light border-2 border-primary shadow-neon -translate-y-4 scale-105' : 'bg-surface border border-white/5'}`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Most Popular</div>
    )}
    <h3 className="text-2xl font-bold mb-2">{name}</h3>
    <p className="text-sm text-text-secondary mb-8">{desc}</p>
    <div className="mb-8 flex items-baseline gap-1">
      <span className="text-5xl font-black">{price}</span>
      <span className="text-text-secondary">/month</span>
    </div>
    <ul className="space-y-4 mb-10 flex-1">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
          {f}
        </li>
      ))}
    </ul>
    <button 
      onClick={onAction}
      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
        popular ? 'bg-primary text-white shadow-neon' : 'border border-white/10 hover:bg-white/5'
      }`}
    >
      {btnText}
    </button>
  </div>
);

export default PricingPage;
