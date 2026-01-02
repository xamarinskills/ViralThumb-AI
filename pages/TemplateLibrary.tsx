
import React, { useState, useMemo } from 'react';
import { Navbar, Footer } from '../components/Layout';
import { TEMPLATES } from '../constants';
import { User } from '../types';

// Add user and onLogout to the props interface
interface TemplateLibraryProps {
  onNavigate: (page: any) => void;
  user?: User | null;
  onLogout?: () => void;
}

const CATEGORIES = [
  'All',
  'Gaming',
  'Vlogs',
  'Tutorials',
  'MrBeast Shock',
  'Clean Tech',
  '"Versus" Battle',
  'Dark Suspense',
  'Gaming/Neon',
  'Lifestyle',
  'Finance'
];

// Destructure new props and pass them to Navbar
const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onNavigate, user, onLogout }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar onNavigate={onNavigate} variant="app" user={user} onLogout={onLogout} activePage="templates" />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Thumbnail <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Template Library</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl">
            Browse high-CTR designs curated by our AI engine. Filter by niche to find the perfect starting point for your next viral hit.
          </p>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col gap-8 mb-12">
          {/* Search Bar */}
          <div className="relative w-full max-w-2xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates (e.g. 'Shock', 'Gaming')..."
              className="w-full h-14 pl-12 pr-4 bg-surface border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-white placeholder:text-text-secondary/50"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
            {CATEGORIES.map((tag) => (
              <button 
                key={tag} 
                onClick={() => setActiveCategory(tag)}
                className={`shrink-0 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-300 ${
                  tag === activeCategory 
                  ? 'bg-primary border-primary text-white shadow-neon' 
                  : 'bg-surface border-white/10 text-text-secondary hover:border-primary/50 hover:bg-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 animate-fade-in">
            {filteredTemplates.map((item) => (
              <div key={item.id} className="group flex flex-col rounded-3xl bg-surface border border-white/5 overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-neon-strong hover:-translate-y-2">
                <div className="aspect-video relative overflow-hidden">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px] p-4 text-center">
                    <button 
                      onClick={() => onNavigate('generator')}
                      className="px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-primary hover:text-white transition-colors mb-2"
                    >
                      Use Design
                    </button>
                    <p className="text-[10px] text-white/60 font-medium">Click to open in Studio</p>
                  </div>
                  
                  {item.isPremium && (
                    <div className="absolute top-4 right-4 h-8 px-3 rounded-full glass border border-yellow-500/30 flex items-center justify-center text-yellow-500 gap-1.5 shadow-lg">
                      <span className="material-symbols-outlined text-[14px] fill-1">lock</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Premium</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase text-primary tracking-widest">{item.category}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-wider">{item.badge}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm leading-snug line-clamp-2 text-white group-hover:text-primary transition-colors">{item.title}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm">trending_up</span>
                      <span className="text-[10px] font-bold text-text-secondary">Predicted CTR: <span className="text-white">High</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
            <h3 className="text-xl font-bold">No templates found</h3>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {filteredTemplates.length >= 8 && (
          <div className="flex justify-center mb-20">
            <button className="flex items-center gap-2 px-10 py-4 rounded-2xl glass border border-white/10 hover:border-primary transition-all font-black text-xs uppercase tracking-[0.2em] group">
              <span>View More Designs</span>
              <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">expand_more</span>
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TemplateLibrary;
