
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vthumb_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 10));
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
        } catch (e: any) {
          console.error(`Error in variation ${i}`, e);
          if (i === 0) throw new Error(e.message || "The AI model is currently busy. Please try again.");
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
      const data = await generateVideoSuggestions(prompt, style, variationUrls);
      setSuggestions(data || { titles: ["Viral Video A", "Viral Video B", "Viral Video C"], description: "Optimized for search." });
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
            <section>
              <h2 className="text-3xl font-black tracking-tight mb-12">Creative Output</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {results.map((url, idx) => (
                  <div key={`res-group-${idx}`} className="flex flex-col gap-4 animate-fade-in">
                    <div className="group relative aspect-video rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-surface-light hover:shadow-neon/40 transition-all duration-500">
                      <img src={url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 transition-all duration-300 backdrop-blur-md">
                        <button onClick={() => setPreviewingIndex(idx)} className="px-7 py-3.5 bg-white text-black text-xs font-black rounded-xl hover:scale-110 active:scale-90 transition-all">PREVIEW</button>
                        <button onClick={() => setEditingIndex(idx)} className="w-14 h-14 bg-primary text-white flex items-center justify-center rounded-xl hover:scale-110 active:scale-90 transition-all shadow-neon"><span className="material-symbols-outlined">edit</span></button>
                      </div>
                    </div>
                    
                    <div className="px-2 mt-2">
                       {isSuggestionsLoading ? (
                          <div className="space-y-2">
                            <div className="h-4 w-full bg-white/5 animate-pulse rounded" />
                            <div className="h-4 w-2/3 bg-white/5 animate-pulse rounded" />
                          </div>
                       ) : (
                         <>
                           <h3 className="text-[16px] font-black leading-tight text-white/95 line-clamp-2">
                              {suggestions?.titles?.[idx] || `Clickbait Concept #${idx + 1}`}
                           </h3>
                           <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">High-CTR Concept</span>
                              <div className="w-1 h-1 rounded-full bg-white/20"></div>
                              <span className="text-[10px] font-bold text-text-secondary">AI Analyzed</span>
                           </div>
                         </>
                       )}
                    </div>
                  </div>
                ))}
                
                {isGenerating && Array.from({ length: Math.max(0, 3 - results.length) }).map((_, i) => (
                  <div key={`skel-group-${i}`} className="flex flex-col gap-4">
                    <div className="aspect-video rounded-[32px] bg-surface-light border border-white/5 flex flex-col items-center justify-center gap-5 animate-pulse">
                      <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-neon" />
                    </div>
                    <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse ml-2" />
                    <div className="h-3 w-1/4 bg-white/5 rounded animate-pulse ml-2" />
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

      {/* YOUTUBE PREVIEW MODAL */}
      {previewingIndex !== null && (
        <div className="fixed inset-0 z-[150] bg-[#0f0f0f] flex flex-col overflow-y-auto custom-scrollbar animate-fade-in">
          {/* Mock YouTube Top Bar */}
          <header className="h-14 px-4 flex items-center justify-between sticky top-0 bg-[#0f0f0f] z-[160] border-b border-white/5">
            <div className="flex items-center gap-4">
               {/* Close button replaces hamburger */}
               <button onClick={() => setPreviewingIndex(null)} className="material-symbols-outlined hover:bg-white/10 p-2 rounded-full">close</button>
               <div className="flex items-center gap-1 cursor-pointer">
                  <div className="w-8 h-6 bg-red-600 rounded-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[18px] fill-1">play_arrow</span>
                  </div>
                  <span className="font-bold tracking-tighter text-xl">YouTube</span>
               </div>
            </div>
            <div className="hidden md:flex items-center flex-1 max-w-2xl px-8">
               <div className="flex flex-1 items-center bg-[#121212] border border-white/10 rounded-full pl-5">
                  <input type="text" placeholder="Search" className="flex-1 bg-transparent outline-none py-2 text-sm" />
                  <button className="bg-white/5 px-5 h-10 rounded-r-full border-l border-white/10 hover:bg-white/10">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </button>
               </div>
               <button className="material-symbols-outlined ml-4 bg-[#121212] p-2 rounded-full hover:bg-white/10">mic</button>
            </div>
            <div className="flex items-center gap-4">
               <span className="material-symbols-outlined hover:bg-white/10 p-2 rounded-full">video_call</span>
               <span className="material-symbols-outlined hover:bg-white/10 p-2 rounded-full">notifications</span>
               <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">C</div>
            </div>
          </header>

          <div className="max-w-[1700px] mx-auto w-full px-4 lg:px-20 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              {/* Video Player Area */}
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl relative group ring-1 ring-white/10">
                 <img src={results[previewingIndex]} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
                       <div className="h-full bg-red-600 w-1/3 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex gap-4">
                          <span className="material-symbols-outlined fill-1">play_arrow</span>
                          <span className="material-symbols-outlined">skip_next</span>
                          <span className="material-symbols-outlined">volume_up</span>
                       </div>
                       <div className="flex gap-4 items-center">
                          <span className="text-[11px] font-medium opacity-80">Settings</span>
                          <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Title & Actions */}
              <div className="mt-4">
                <h1 className="text-xl md:text-2xl font-black mb-3 leading-tight tracking-tight">
                   {suggestions?.titles?.[previewingIndex] || `High Click Variation #${previewingIndex + 1}`}
                </h1>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-white/5 pb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white font-bold">C</div>
                      <div>
                         <p className="font-bold text-[15px] leading-tight flex items-center gap-1">Creator Studio <span className="material-symbols-outlined text-[14px] text-blue-400 fill-1">check_circle</span></p>
                         <p className="text-xs text-text-secondary">4.91M subscribers</p>
                      </div>
                      <button className="ml-4 h-9 px-4 bg-white text-black font-black text-xs rounded-full hover:bg-gray-200 transition-colors">Subscribe</button>
                   </div>

                   {/* REFINED ACTION BAR */}
                   <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                      {/* Segmented Like/Dislike */}
                      <div className="flex items-center bg-white/10 rounded-full h-9 shrink-0">
                         <button className="flex items-center gap-2 px-4 hover:bg-white/10 border-r border-white/10 rounded-l-full h-full">
                           <span className="material-symbols-outlined text-[20px]">thumb_up</span> 
                           <span className="text-[13px] font-medium">36K</span>
                         </button>
                         <button className="px-3 hover:bg-white/10 rounded-r-full h-full">
                           <span className="material-symbols-outlined text-[20px]">thumb_down</span>
                         </button>
                      </div>

                      {/* Share */}
                      <button className="flex items-center gap-2 px-4 h-9 bg-white/10 rounded-full hover:bg-white/20 shrink-0">
                         <span className="material-symbols-outlined text-[20px]">share</span> 
                         <span className="text-[13px] font-medium">Share</span>
                      </button>

                      {/* Ask (AI Tool) */}
                      <button className="flex items-center gap-2 px-4 h-9 bg-white/10 rounded-full hover:bg-white/20 shrink-0">
                         <span className="material-symbols-outlined text-[20px] text-primary fill-1">auto_awesome</span> 
                         <span className="text-[13px] font-medium">Ask</span>
                      </button>

                      {/* Save */}
                      <button className="flex items-center gap-2 px-4 h-9 bg-white/10 rounded-full hover:bg-white/20 shrink-0">
                         <span className="material-symbols-outlined text-[20px]">playlist_add</span> 
                         <span className="text-[13px] font-medium">Save</span>
                      </button>

                      {/* More */}
                      <button className="flex items-center justify-center min-w-[36px] h-9 bg-white/10 rounded-full hover:bg-white/20 shrink-0">
                         <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                   </div>
                </div>

                {/* Description Box */}
                <div className="mt-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                   <p className="text-[13px] font-bold mb-1">907,233 views  1 day ago  #ViralThumbAI #CreatorEconomy</p>
                   <p className="text-[13px] text-white/90 leading-relaxed line-clamp-2">
                     {suggestions?.description || "This video breaks down the psychological hooks used in high-CTR thumbnails. Learn how to convert more impressions into clicks with AI assistance."}
                   </p>
                   <span className="text-[13px] font-bold mt-2 block">...more</span>
                </div>
              </div>
            </div>

            {/* Sidebar Suggested Videos */}
            <div className="lg:col-span-4 space-y-4">
               <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                  {['All', 'From this channel', 'Related', 'Recent'].map(t => (
                    <span key={t} className="shrink-0 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-bold border border-white/5 hover:bg-white/20 cursor-pointer">{t}</span>
                  ))}
               </div>
               
               {results.map((url, idx) => (
                 <div 
                   key={`side-${idx}`} 
                   onClick={() => setPreviewingIndex(idx)}
                   className={`flex gap-3 group cursor-pointer p-2 rounded-xl transition-all ${idx === previewingIndex ? 'bg-white/10 ring-1 ring-primary/30' : 'hover:bg-white/5'}`}
                 >
                    <div className="relative w-40 h-24 shrink-0 bg-black rounded-lg overflow-hidden border border-white/5">
                       <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                       <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 font-bold rounded">11:05</span>
                    </div>
                    <div className="flex-1">
                       <h3 className="text-[13px] font-bold leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {suggestions?.titles?.[idx] || "Thumbnail Hook Variation #"+(idx+1)}
                       </h3>
                       <p className="text-[11px] text-text-secondary">Creator Studio</p>
                       <p className="text-[11px] text-text-secondary">42K views • 2 weeks ago</p>
                    </div>
                 </div>
               ))}
               
               <div className="pt-6 border-t border-white/5">
                 <button 
                   onClick={() => {
                      const link = document.createElement('a');
                      link.href = results[previewingIndex];
                      link.download = `ViralThumb_${previewingIndex + 1}.jpg`;
                      link.click();
                   }}
                   className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-neon flex items-center justify-center gap-2 hover:bg-primary-hover transition-all"
                 >
                   <span className="material-symbols-outlined">download</span>
                   Final Download (4K)
                 </button>
               </div>
            </div>
          </div>
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
