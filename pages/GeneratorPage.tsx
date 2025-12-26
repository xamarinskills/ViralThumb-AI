
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Navbar } from '../components/Layout';
import { User, Template, Thumbnail } from '../types';
import { generateThumbnailVariation, generateVideoSuggestions, enhancePrompt } from '../services/gemini';
import { TEMPLATES } from '../constants';

interface GeneratorPageProps {
  user: User | null;
  onNavigate: (page: any) => void;
}

interface EditSettings {
  brightness: number;
  contrast: number;
  saturate: number;
  hue: number;
  blur: number;
  rotation: number;
  zoom: number;
}

interface VideoSuggestions {
  titles: string[];
  description: string;
}

const GeneratorPage: React.FC<GeneratorPageProps> = ({ user, onNavigate }) => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("MrBeast Style (High Saturation)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [history, setHistory] = useState<Thumbnail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [styleFilter, setStyleFilter] = useState('All Styles');

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSettings, setEditSettings] = useState<EditSettings>({
    brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, rotation: 0, zoom: 1
  });

  const [previewingIndex, setPreviewingIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<VideoSuggestions | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recovery and storage with high safety
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vthumb_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 10)); // Max 10 to save space
      }
    } catch (e) {
      console.error("History recovery error", e);
    }
  }, []);

  useEffect(() => {
    try {
      if (history.length > 0) {
        localStorage.setItem('vthumb_history', JSON.stringify(history.slice(0, 10)));
      }
    } catch (e) {
      console.warn("Storage quota limit reached", e);
    }
  }, [history]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      if (uploadedAssets.length >= 3) return;
      const reader = new FileReader();
      reader.onloadend = () => setUploadedAssets(prev => [...prev, reader.result as string].slice(0, 3));
      reader.readAsDataURL(file);
    });
  };

  const removeAsset = (index: number) => setUploadedAssets(prev => prev.filter((_, i) => i !== index));

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setPrompt(`Thumbnail inspired by "${template.title}".`);
    setStyle(template.category === 'Gaming' ? 'Anime / Manga Style' : 'MrBeast Style (High Saturation)');
    setShowTemplateModal(false);
  };

  const handleMagicPrompt = async () => {
    if (!prompt || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    setResults([]);
    setSuggestions(null);

    const variationUrls: string[] = [];

    try {
      for (let i = 0; i < 3; i++) {
        try {
          const img = await generateThumbnailVariation(prompt, style, uploadedAssets, i);
          if (img) {
            variationUrls.push(img);
            setResults(prev => [...prev, img]);
          }
        } catch (e) {
          console.error(`Error in variation ${i}`, e);
          if (i === 0) throw new Error("The AI model is currently busy. Please try a shorter prompt.");
        }
        if (i < 2) await new Promise(r => setTimeout(r, 1200));
      }

      const newItems: Thumbnail[] = variationUrls.map((url, i) => ({
        id: `gen-${Date.now()}-${i}`,
        url,
        prompt,
        style,
        createdAt: new Date().toISOString(),
        status: 'completed'
      }));
      setHistory(prev => [...newItems, ...prev].slice(0, 20));

      setIsSuggestionsLoading(true);
      const data = await generateVideoSuggestions(prompt, style);
      setSuggestions(data || { titles: ["Viral Video Concept"], description: "Optimized for search." });
    } catch (err: any) {
      setError(err.message || "Failed to generate variations.");
    } finally {
      setIsGenerating(false);
      setIsSuggestionsLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesStyle = styleFilter === 'All Styles' || item.style === styleFilter;
      const createdTime = new Date(item.createdAt).getTime();
      const now = Date.now();
      
      let matchesTime = true;
      if (timeFilter === 'Last 24 Hours') matchesTime = (now - createdTime) <= (24 * 60 * 60 * 1000);
      else if (timeFilter === 'Last 7 Days') matchesTime = (now - createdTime) <= (7 * 24 * 60 * 60 * 1000);
      
      return matchesStyle && matchesTime;
    });
  }, [history, styleFilter, timeFilter]);

  const saveEdits = () => {
    if (editingIndex === null || !results[editingIndex]) return;
    const img = new Image();
    img.src = results[editingIndex];
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const isRotated = (editSettings.rotation / 90) % 2 !== 0;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;
      ctx.filter = `brightness(${editSettings.brightness}%) contrast(${editSettings.contrast}%) saturate(${editSettings.saturate}%) hue-rotate(${editSettings.hue}deg) blur(${editSettings.blur}px)`;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((editSettings.rotation * Math.PI) / 180);
      ctx.scale(editSettings.zoom, editSettings.zoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      const newUrl = canvas.toDataURL('image/jpeg', 0.95);
      setResults(prev => {
        const n = [...prev];
        n[editingIndex] = newUrl;
        return n;
      });
      setEditingIndex(null);
    };
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-white selection:bg-primary">
      <Navbar onNavigate={onNavigate} variant="app" user={user} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Input Sidebar */}
        <aside className="w-[440px] flex-shrink-0 border-r border-white/5 bg-surface overflow-y-auto custom-scrollbar p-8">
          <div className="space-y-12">
            <header>
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary mb-2">Subject Studio</h2>
              <p className="text-[11px] text-text-secondary">Upload faces to blend into the AI generation.</p>
            </header>

            <section>
              <div className="grid grid-cols-3 gap-4">
                {uploadedAssets.map((asset, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group shadow-lg">
                    <img src={asset} className="w-full h-full object-cover" />
                    <button onClick={() => removeAsset(idx)} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="material-symbols-outlined text-white">delete</span></button>
                  </div>
                ))}
                {uploadedAssets.length < 3 && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center text-text-secondary transition-all">
                    <span className="material-symbols-outlined text-2xl mb-1">add_a_photo</span>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Core Concept</label>
                <button onClick={handleMagicPrompt} disabled={isEnhancing || !prompt} className="text-[10px] font-black uppercase text-primary hover:underline disabled:opacity-30">
                  {isEnhancing ? 'Enhancing...' : 'Magic Enhance'}
                </button>
              </div>
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Ex: 'Reaction to scary ghost', 'Winning a race'..." 
                className="w-full h-44 p-5 bg-surface-light border border-white/5 rounded-3xl text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:opacity-20 leading-relaxed resize-none" 
              />
            </section>

            <section className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">AI Visual Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full h-14 px-6 bg-surface-light border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                <option>MrBeast Style (High Saturation)</option>
                <option>Dark Horror & Gritty</option>
                <option>Tech Futuristic & Clean</option>
                <option>Anime / Manga Style</option>
              </select>
            </section>

            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt} 
              className="w-full h-16 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-black rounded-2xl shadow-neon transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isGenerating ? (
                <><span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>Generating...</>
              ) : (
                <><span className="material-symbols-outlined">bolt</span>Create Viral Versions</>
              )}
            </button>
            {error && <p className="text-red-400 text-xs font-bold p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">{error}</p>}
          </div>
        </aside>

        {/* Right: Output Canvas */}
        <main className="flex-1 bg-background p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-24">
            {/* CURRENT OUTPUT GRID */}
            <section>
              <h2 className="text-3xl font-black tracking-tight mb-12">Creative Output</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {results.map((url, idx) => (
                  <div key={`res-${idx}`} className="group relative aspect-video rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-surface-light animate-fade-in hover:shadow-neon/40 transition-all duration-500">
                    <img src={url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 transition-all duration-300 backdrop-blur-md">
                      <button onClick={() => setPreviewingIndex(idx)} className="px-7 py-3.5 bg-white text-black text-xs font-black rounded-xl hover:scale-110 active:scale-90 transition-all">PREVIEW</button>
                      <button onClick={() => setEditingIndex(idx)} className="w-14 h-14 bg-primary text-white flex items-center justify-center rounded-xl hover:scale-110 active:scale-90 transition-all shadow-neon"><span className="material-symbols-outlined">edit</span></button>
                    </div>
                  </div>
                ))}
                
                {isGenerating && Array.from({ length: Math.max(0, 3 - results.length) }).map((_, i) => (
                  <div key={`skel-${i}`} className="aspect-video rounded-[32px] bg-surface-light border border-white/5 flex flex-col items-center justify-center gap-5 animate-pulse">
                    <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-neon" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Crafting Variation {results.length + i + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ARCHIVE */}
            <section className="pt-16 border-t border-white/5">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-2xl font-black flex items-center gap-4"><span className="material-symbols-outlined text-primary text-4xl">history</span> Generation Archive</h3>
                <div className="flex gap-4">
                  <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-surface border border-white/10 rounded-xl px-5 h-12 text-[11px] font-black uppercase tracking-widest outline-none">
                    <option>All Time</option>
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                  </select>
                </div>
              </div>

              {filteredHistory.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="group relative rounded-3xl overflow-hidden border border-white/5 bg-surface hover:border-primary transition-all">
                      <div className="aspect-video relative overflow-hidden bg-black">
                        <img src={item.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = item.url;
                              link.download = `ViralThumb.jpg`;
                              link.click();
                            }} 
                            className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">{item.style}</p>
                        <p className="text-xs font-bold truncate opacity-90">{item.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center opacity-20"><p className="font-black uppercase tracking-widest">No history found</p></div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* PIXEL-PERFECT YOUTUBE PLAYER MOCKUP MODAL */}
      {previewingIndex !== null && results[previewingIndex] && (
        <div className="fixed inset-0 z-[150] bg-[#0f0f0f] flex flex-col overflow-hidden animate-fade-in">
          {/* YouTube Top Bar */}
          <header className="h-14 px-4 flex items-center justify-between bg-[#0f0f0f] border-b border-transparent">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white/10 rounded-full"><span className="material-symbols-outlined text-white">menu</span></button>
              <div className="flex items-center gap-0.5">
                <img src="https://www.gstatic.com/youtube/img/branding/favicon/favicon_144x144.png" className="w-8 h-8" />
                <span className="text-lg font-bold tracking-tighter flex items-center">YouTube<sup className="text-[8px] font-normal ml-0.5 opacity-60">IN</sup></span>
              </div>
            </div>
            
            <div className="flex-1 max-w-[720px] mx-10 flex items-center gap-4">
              <div className="flex-1 flex items-center h-10 bg-[#121212] border border-[#333] rounded-full overflow-hidden">
                <input type="text" placeholder="Search" className="flex-1 px-4 bg-transparent outline-none text-sm placeholder:text-white/40" />
                <button className="w-16 h-full bg-[#222] border-l border-[#333] flex items-center justify-center hover:bg-[#333]"><span className="material-symbols-outlined text-white text-xl">search</span></button>
              </div>
              <button className="w-10 h-10 rounded-full bg-[#181818] hover:bg-[#222] flex items-center justify-center"><span className="material-symbols-outlined text-white text-xl">mic</span></button>
            </div>

            <div className="flex items-center gap-3">
              <button className="h-10 px-4 rounded-full flex items-center gap-2 hover:bg-white/10"><span className="material-symbols-outlined text-white">video_call</span><span className="text-sm font-medium">Create</span></button>
              <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-white">notifications</span></button>
              <button className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-[10px] font-bold">R</button>
              <button onClick={() => setPreviewingIndex(null)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ml-2"><span className="material-symbols-outlined text-white">close</span></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f0f] px-6 md:px-14 py-6">
            <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
              
              {/* Primary Content (Left) */}
              <div className="space-y-4">
                {/* Main Video Player */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/5 group">
                  <img src={results[previewingIndex]} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="h-1 bg-white/20 rounded-full mb-3"><div className="h-full w-1/3 bg-red-600 rounded-full"></div></div>
                    <div className="flex items-center justify-between"><div className="flex gap-4"><span className="material-symbols-outlined">play_arrow</span><span className="material-symbols-outlined">skip_next</span><span className="material-symbols-outlined">volume_up</span><span className="text-xs">0:45 / 15:00</span></div><div className="flex gap-4"><span className="material-symbols-outlined">settings</span><span className="material-symbols-outlined">fullscreen</span></div></div>
                  </div>
                </div>

                {/* Video Info Header */}
                <h1 className="text-xl font-bold leading-tight">{suggestions?.titles?.[previewingIndex] || "Bangladesh में हुए \"Anti Indian Forces\" Expose | @RJRaunac"}</h1>

                {/* Channel & Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src="https://picsum.photos/seed/rj/80/80" className="w-10 h-10 rounded-full" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1"><span className="font-bold text-sm truncate">RJ Raunac</span><span className="material-symbols-outlined text-[14px] text-white/60 fill-1">check_circle</span></div>
                      <p className="text-[12px] text-white/60">4.91M subscribers</p>
                    </div>
                    <button className="ml-3 px-4 h-9 bg-white text-black rounded-full text-sm font-bold hover:bg-[#d9d9d9] transition-colors">Subscribe</button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-9 bg-white/10 rounded-full overflow-hidden">
                      <button className="flex items-center gap-2 px-4 hover:bg-white/20 border-r border-white/10 text-sm font-medium"><span className="material-symbols-outlined text-sm">thumb_up</span>36K</button>
                      <button className="px-3 hover:bg-white/20"><span className="material-symbols-outlined text-sm">thumb_down</span></button>
                    </div>
                    <button className="h-9 px-4 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 text-sm font-medium"><span className="material-symbols-outlined text-sm">share</span>Share</button>
                    <button className="h-9 px-4 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 text-sm font-medium"><span className="material-symbols-outlined text-sm">auto_fix_high</span>Ask</button>
                    <button className="h-9 px-4 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 text-sm font-medium"><span className="material-symbols-outlined text-sm">bookmark</span>Save</button>
                    <button className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-sm">more_horiz</span></button>
                  </div>
                </div>

                {/* Description Box */}
                <div className="bg-white/10 rounded-xl p-3 hover:bg-white/[0.15] transition-colors cursor-pointer text-sm">
                  <div className="flex gap-2 font-bold mb-1">
                    <span>907,233 views</span>
                    <span>1 day ago</span>
                    <span className="text-white/60">#BangladeshCrisis #News</span>
                  </div>
                  <p className="whitespace-pre-wrap line-clamp-2 text-white/90">
                    {suggestions?.description || "Watch VIRAL बात RAUNAC के साथ! Full expose on the current situation. Don't forget to like and subscribe for more deep dives into trending topics."}
                  </p>
                  <button className="font-bold mt-2 text-white hover:underline">...more</button>
                </div>

                {/* Mock Live Chat Box */}
                <div className="border border-white/10 rounded-xl overflow-hidden mt-6">
                  <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <span className="font-bold text-sm">Live chat replay</span>
                    <button className="p-1 hover:bg-white/10 rounded-lg"><span className="material-symbols-outlined text-sm">close</span></button>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-white/40">chat</span>
                    <span className="text-sm text-white/60">See what others said about this video while it was live.</span>
                    <button className="ml-auto px-4 py-1.5 border border-white/20 hover:bg-white/10 rounded-full text-xs font-bold">Open panel</button>
                  </div>
                </div>
              </div>

              {/* Sidebar (Right) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold mb-4 opacity-60">Up Next</h3>
                {/* Map generated results or templates as sidebar items */}
                {[...results, results[0], results[0], results[0]].slice(1, 10).map((url, i) => (
                  <div key={i} className="flex gap-2 group cursor-pointer">
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0">
                      <img src={url || `https://picsum.photos/seed/${i}/320/180`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded font-bold">11:47</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">{suggestions?.titles?.[(i+1)%3] || "Another Viral Title Concept"}</h4>
                      <p className="text-[12px] text-white/60 mt-1">RJ Raunac <span className="material-symbols-outlined text-[10px] fill-1">check_circle</span></p>
                      <p className="text-[12px] text-white/60">777K views • 2 weeks ago</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
          
          {/* Action Footer for AI Actions */}
          <footer className="h-20 bg-[#0f0f0f] border-t border-white/5 flex items-center justify-center gap-4 px-10">
             <button onClick={() => setPreviewingIndex(null)} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full font-bold text-sm transition-all">Close Mockup</button>
             <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = results[previewingIndex];
                  link.download = `YouTube_Thumbnail_${previewingIndex + 1}.jpg`;
                  link.click();
                }} 
                className="px-10 py-2.5 bg-primary rounded-full font-bold text-sm shadow-neon hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span> Export Final Image
              </button>
          </footer>
        </div>
      )}

      {/* EDITOR MODAL */}
      {editingIndex !== null && results[editingIndex] && (
        <div className="fixed inset-0 z-[200] bg-background p-10 flex flex-col md:flex-row gap-12 animate-fade-in">
          <div className="flex-1 flex flex-col items-center justify-center bg-black/50 rounded-[50px] border border-white/5 p-12">
            <div 
              className="aspect-video w-full max-w-5xl shadow-2xl rounded-3xl overflow-hidden ring-4 ring-primary/30"
              style={{ 
                filter: `brightness(${editSettings.brightness}%) contrast(${editSettings.contrast}%) saturate(${editSettings.saturate}%) hue-rotate(${editSettings.hue}deg) blur(${editSettings.blur}px)`,
                transform: `rotate(${editSettings.rotation}deg) scale(${editSettings.zoom})`
              }}
            >
              <img src={results[editingIndex]} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="w-full md:w-[460px] bg-surface p-12 rounded-[50px] border border-white/10 flex flex-col gap-12">
            <header className="flex items-center justify-between">
              <h3 className="text-2xl font-black flex items-center gap-3">Visual Lab</h3>
              <button onClick={() => setEditingIndex(null)} className="text-text-secondary hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </header>
            <div className="space-y-12 flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <Slider label="Exposure" val={editSettings.brightness} min={50} max={150} onChange={v => setEditSettings({...editSettings, brightness: v})} />
              <Slider label="Punch" val={editSettings.contrast} min={50} max={180} onChange={v => setEditSettings({...editSettings, contrast: v})} />
              <Slider label="Vibrance" val={editSettings.saturate} min={50} max={200} onChange={v => setEditSettings({...editSettings, saturate: v})} />
              <Slider label="Blur" val={editSettings.blur} min={0} max={15} step={0.5} onChange={v => setEditSettings({...editSettings, blur: v})} />
              <Slider label="Zoom" val={editSettings.zoom} min={1} max={1.5} step={0.01} onChange={v => setEditSettings({...editSettings, zoom: v})} />
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={saveEdits} className="w-full h-16 bg-primary rounded-2xl font-black text-lg shadow-neon">COMMIT CHANGES</button>
              <button onClick={() => setEditingIndex(null)} className="w-full h-16 bg-white/5 rounded-2xl font-black">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Slider = ({ label, val, min, max, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
      <span>{label}</span>
      <span className="text-primary">{val}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-primary h-1.5 bg-background rounded-full cursor-pointer appearance-none outline-none" />
  </div>
);

export default GeneratorPage;
