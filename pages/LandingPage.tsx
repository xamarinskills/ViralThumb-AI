
import React from 'react';
import { Navbar, Footer } from '../components/Layout';

interface LandingPageProps {
  onNavigate: (page: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary" />
            V3.0 AI Engine Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8">
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Viral</span> YouTube<br /> Thumbnails in Seconds
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12">
            Generate high-CTR thumbnails using proven viral templates and cutting-edge generative AI. Stop wasting hours in Photoshop.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button 
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-10 py-5 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-neon transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">bolt</span>
              Generate Now — Free
            </button>
            <button 
              onClick={() => onNavigate('templates')}
              className="w-full sm:w-auto px-10 py-5 glass hover:bg-white/5 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">grid_view</span>
              Browse Templates
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Trusted by 50,000+ creators</p>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <img 
                  key={i} 
                  src={`https://picsum.photos/seed/${i}/100/100`} 
                  className="w-10 h-10 rounded-full border-2 border-background" 
                  alt="Creator"
                />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-background bg-surface flex items-center justify-center text-[10px] font-bold">+2k</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Built for the Algorithm</h2>
            <p className="text-text-secondary">Everything you need to boost your CTR and go viral.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="face_retouching_natural"
              title="AI Face Swap"
              desc="Instantly swap faces with perfect lighting matching. Keep your brand consistent."
            />
            <FeatureCard 
              icon="type_specimen"
              title="Smart Text Overlay"
              desc="Auto-generate readable, high-contrast text that grabs viewers' attention immediately."
            />
            <FeatureCard 
              icon="monitoring"
              title="Viral Scorer"
              desc="Our model predicts CTR potential based on millions of top-performing videos."
            />
          </div>
        </div>
      </section>

      {/* Example Showcase */}
      <section id="showcase" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Made with {APP_NAME}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-neon transition-all duration-300">
                  <img src={`https://picsum.photos/seed/viral${i}/800/450`} alt="Viral Thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded">CTR 12.4%</div>
                </div>
                <h3 className="font-bold text-sm">Example Video Title #{i}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer onAdminClick={() => onNavigate('admin')} />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
  <div className="p-8 rounded-3xl bg-surface border border-white/5 hover:border-primary/50 transition-all group">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
  </div>
);

const APP_NAME = "ViralThumb AI";

export default LandingPage;
