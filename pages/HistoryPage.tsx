
import React, { useState, useEffect } from 'react';
import { Navbar, Footer } from '../components/Layout';
import { User } from '../types';
import { getUserGenerations } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryPageProps {
  user: User | null;
  onNavigate: (page: any) => void;
  onLogout?: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ user, onNavigate, onLogout }) => {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 12;

  // Mock total count for the subtitle (since getUserGenerations doesn't return count)
  // In a real app, we'd fetch count separately.
  const totalCount = 145; 

  const loadGenerations = async (reset = false) => {
    if (!user) return;
    
    const currentOffset = reset ? 0 : offset;
    if (!reset) setLoadingMore(true);
    
    try {
      const newGenerations = await getUserGenerations(user.id, LIMIT, currentOffset);
      
      if (reset) {
        setGenerations(newGenerations || []);
        setOffset(LIMIT);
      } else {
        setGenerations(prev => [...prev, ...(newGenerations || [])]);
        setOffset(prev => prev + LIMIT);
      }
      
      if (!newGenerations || newGenerations.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadGenerations(true);
  }, [user]);

  const filteredGenerations = generations.filter(gen => 
    (gen.prompt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (gen.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      <Navbar onNavigate={onNavigate} variant="app" user={user} onLogout={onLogout} activePage="history" />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-12">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Generation History</h1>
            <p className="text-lg text-text-secondary max-w-2xl font-medium">
              Manage, download, or regenerate your AI-created thumbnails. <span className="text-white">{totalCount} saved generations.</span>
            </p>
          </div>

          {/* TOOLBAR */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Search by prompt..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-text-secondary/50"
              />
            </div>
            
            <div className="hidden sm:flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
               <div className="relative">
                  <select className="h-10 pl-4 pr-10 bg-transparent text-sm font-bold outline-none appearance-none cursor-pointer text-white">
                    <option className="bg-background">Newest First</option>
                    <option className="bg-background">Oldest First</option>
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm pointer-events-none text-text-secondary">expand_more</span>
               </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-text-secondary hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-text-secondary hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* GRID CONTENT */}
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="aspect-video rounded-3xl bg-white/5 animate-pulse border border-white/5" />
             ))}
           </div>
        ) : filteredGenerations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
             <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
               <span className="material-symbols-outlined text-4xl text-white/20">image_search</span>
             </div>
             <h3 className="text-xl font-bold mb-2">No generations found</h3>
             <p className="text-text-secondary mb-8">Try adjusting your search or generate a new thumbnail.</p>
             <button 
               onClick={() => onNavigate('generator')}
               className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-neon"
             >
               Create New
             </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}
          >
            <AnimatePresence mode='popLayout'>
              {filteredGenerations.map((gen, idx) => (
                <motion.div
                  key={gen.id || idx}
                  variants={itemVariants}
                  layout
                  className={`group relative bg-surface border border-white/5 rounded-3xl overflow-hidden hover:border-primary/50 hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)] transition-all duration-300 ${viewMode === 'list' ? 'flex h-32' : 'aspect-[16/10]'}`}
                  whileHover={{ y: -6 }}
                >
                  {/* Image Container */}
                  <div className={`relative overflow-hidden bg-black ${viewMode === 'list' ? 'w-48 h-full' : 'w-full h-full'}`}>
                    <img 
                      src={gen.output_url} 
                      alt={gen.prompt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-white">AI Generated</span>
                    </div>

                    {/* Hover Actions Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center gap-3 z-20">
                      <ActionBtn icon="download" label="Download" onClick={() => {
                        const link = document.createElement('a');
                        link.href = gen.output_url;
                        link.download = `ViralThumb_${gen.id}.png`;
                        link.click();
                      }} delay={0} />
                      <ActionBtn icon="refresh" label="Regenerate" onClick={() => onNavigate('generator')} delay={0.1} />
                      <ActionBtn icon="visibility" label="View" onClick={() => window.open(gen.output_url, '_blank')} delay={0.2} />
                    </div>
                  </div>

                  {/* Content (Grid View Overlay vs List View Side) */}
                  <div className={`absolute bottom-0 left-0 right-0 p-5 ${viewMode === 'list' ? 'static flex-1 flex flex-col justify-center bg-surface' : 'z-10'}`}>
                    <h3 className="font-bold text-white text-sm mb-1 truncate pr-12 leading-tight">
                      {gen.title || gen.prompt || "Untitled Generation"}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] font-medium text-text-secondary/80">
                      <span>{new Date(gen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                        <span className="material-symbols-outlined text-[12px] text-yellow-400">bolt</span>
                        <span>{gen.credits_used || 1}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* LOAD MORE */}
        {hasMore && !loading && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => loadGenerations(false)}
              disabled={loadingMore}
              className="group relative px-8 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold tracking-wide transition-all overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              <div className="relative flex items-center gap-2">
                {loadingMore ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm group-hover:rotate-180 transition-transform duration-500">refresh</span>
                )}
                {loadingMore ? 'Loading History...' : 'Load More History'}
              </div>
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const ActionBtn = ({ icon, label, onClick, delay }: { icon: string, label: string, onClick: () => void, delay: number }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.2 }}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg relative group/btn"
    title={label}
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    {/* Tooltip */}
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
  </motion.button>
);

export default HistoryPage;
