
import React from 'react';
import { Navbar, Footer } from '../components/Layout';
import { User, Thumbnail } from '../types';
import { getUserGenerations } from '../services/supabase';

interface DashboardProps {
  user: User | null;
  onNavigate: (page: any) => void;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [generations, setGenerations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user && user.id !== 'mock-id') {
      loadRecentGenerations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRecentGenerations = async () => {
    if (!user) return;
    try {
      const data = await getUserGenerations(user.id, 3);
      setGenerations(data);
    } catch (err) {
      console.error("Failed to load dashboard generations:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onNavigate={onNavigate} variant="app" user={user} onLogout={onLogout} activePage="dashboard" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-black mb-2">Welcome back, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-text-secondary">Here's how your channel is performing with AI thumbnails.</p>
          </div>
          <button
            onClick={() => onNavigate('generator')}
            className="h-14 px-8 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-neon flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create New Thumbnail
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Generations" value={`${user.credits}/50`} sub="Monthly quota" icon="bolt" />
          <StatCard label="Total Saved" value="145" sub="+12 this week" icon="bookmark" />
          <StatCard label="Storage" value="2.4GB" sub="Cloud sync active" icon="cloud" />
          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-800/20 border border-primary/20 relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('pricing')}>
            <h3 className="font-bold mb-2">Unlock 4K Export</h3>
            <p className="text-xs text-text-secondary mb-4">Upgrade to Pro for high-res exports and priority generation.</p>
            <span className="text-xs font-black text-primary group-hover:underline">Upgrade Now &rarr;</span>
          </div>
        </div>

        {/* Recent Generations */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Recent Generations</h2>
          <button onClick={() => onNavigate('templates')} className="text-sm font-bold text-primary hover:underline">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {!loading && generations.map((gen) => (
            <div key={gen.id} className="group relative rounded-2xl overflow-hidden border border-white/5 glass">
              <div className="aspect-video relative overflow-hidden">
                <img src={gen.output_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={gen.prompt} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a
                    href={gen.output_url}
                    download={`generation-${gen.id}.png`}
                    className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </a>
                  <button
                    onClick={() => onNavigate('generator')}
                    className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">AI Generated</p>
                <h3 className="font-bold text-sm truncate" title={gen.title || gen.prompt}>
                  {gen.title ? `"${gen.title}"` : gen.prompt}
                </h3>
                {gen.description && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {gen.description}
                  </p>
                )}
                <p className="text-[10px] text-text-secondary mt-2">
                  {new Date(gen.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}

          {loading && [1, 2, 3].map((i) => (
            <div key={i} className="aspect-video rounded-2xl bg-surface-light animate-pulse border border-white/5" />
          ))}

          {!loading && generations.length === 0 && (
            <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 bg-white/5">
              <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">image_not_supported</span>
              <p className="text-xs text-text-secondary">No generations yet</p>
            </div>
          )}
          
        </div>

        {/* Promo Banner */}
        <div className="w-full rounded-3xl p-10 bg-gradient-to-r from-primary/20 via-surface to-surface border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-neon shrink-0">
              <span className="material-symbols-outlined text-white text-[32px]">rocket_launch</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Join our Creator Community</h3>
              <p className="text-text-secondary max-w-md">Share your thumbnails, get feedback, and chat with 50,000+ creators on Discord.</p>
            </div>
          </div>
          <button className="px-8 py-4 bg-white text-black font-black rounded-xl hover:bg-gray-100 transition-colors">Join Discord</button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const StatCard = ({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: string }) => (
  <div className="p-6 rounded-3xl bg-surface border border-white/5 shadow-lg">
    <div className="flex justify-between items-start mb-6">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-2xl font-black mb-1">{value}</h4>
    <p className="text-[10px] text-primary font-bold">{sub}</p>
  </div>
);

export default Dashboard;
