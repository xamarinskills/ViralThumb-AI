
import React, { useState, useRef } from 'react';
import { Navbar } from '../components/Layout';
import { User, Template } from '../types';
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

// Fix: Added React to imports and specified React.FC for the component.
const GeneratorPage: React.FC<GeneratorPageProps> = ({ user, onNavigate }) => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("MrBeast Style (High Saturation)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Editor State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSettings, setEditSettings] = useState<EditSettings>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hue: 0,
    blur: 0,
    rotation: 0,
    zoom: 1
  });

  // Preview State
  const [previewingIndex, setPreviewingIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<VideoSuggestions | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix: Explicitly using React.ChangeEvent type for event parameter.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (uploadedAssets.length >= 3) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedAssets(prev => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAsset = (index: number) => {
    setUploadedAssets(prev => prev.filter((_, i) => i !== index));
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setPrompt(`A viral video thumbnail inspired by "${template.title}". High energy, engaging elements, and vibrant colors.`);
    setStyle(template.category === 'Gaming' ? 'Anime / Manga Style' : 'MrBeast Style (High Saturation)');
    setShowTemplateModal(false);
  };

  const handleMagicPrompt = async () => {
    if (!prompt || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      console.error("Failed to enhance prompt", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    setResults([]);

    try {
      const variationPromises = [0, 1, 2].map(idx => 
        generateThumbnailVariation(prompt, style, uploadedAssets, idx)
      );
      
      const images = await Promise.all(variationPromises);
      setResults(images);
      
      // Pre-load suggestions for the variations
      setIsSuggestionsLoading(true);
      const data = await generateVideoSuggestions(prompt, style);
      setSuggestions(data);
      setIsSuggestionsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to generate thumbnails. Check your API key.");
      setIsSuggestionsLoading(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const openPreview = (index: number) => {
    setPreviewingIndex(index);
    // Suggestions are already loaded during generation
  };

  const openEditor = (index: number) => {
    setEditingIndex(index);
    setEditSettings({
      brightness: 100,
      contrast: 100,
      saturate: 100,
      hue: 0,
      blur: 0,
      rotation: 0,
      zoom: 1
    });
  };

  const saveEdits = () => {
    if (editingIndex === null) return;
    const img = new Image();
    img.src = results[editingIndex];
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Handle rotation aspect ratio
      const isRotated = (editSettings.rotation / 90) % 2 !== 0;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;
      
      // Constructing detailed filter string
      const filters = [
        `brightness(${editSettings.brightness}%)`,
        `contrast(${editSettings.contrast}%)`,
        `saturate(${editSettings.saturate}%)`,
        `hue-rotate(${editSettings.hue}deg)`,
        `blur(${editSettings.blur}px)`
      ].join(' ');

      ctx.filter = filters;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((editSettings.rotation * Math.PI) / 180);
      ctx.scale(editSettings.zoom, editSettings.zoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const newResults = [...results];
      newResults[editingIndex] = finalDataUrl;
      setResults(newResults);
      setEditingIndex(null);
    };
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `viralthumb-variation-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-white">
      <Navbar onNavigate={onNavigate} variant="app" user={user} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-[400px] flex-shrink-0 border-r border-white/5 bg-surface overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-8">
            {/* Template Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-4">Starting Template</label>
              {selectedTemplate ? (
                <div className="relative group rounded-xl overflow-hidden border border-primary shadow-neon mb-2">
                  <img src={selectedTemplate.imageUrl} className="w-full h-24 object-cover" alt="Selected Template" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setShowTemplateModal(true)} className="text-[10px] font-black uppercase bg-white text-black px-3 py-1.5 rounded-lg hover:scale-105 transition-transform">Change</button>
                    <button onClick={() => setSelectedTemplate(null)} className="text-[10px] font-black uppercase bg-red-500 text-white px-3 py-1.5 rounded-lg hover:scale-105 transition-transform">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowTemplateModal(true)} className="w-full py-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-white/5 transition-all group">
                  <span className="material-symbols-outlined">style</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Browse Template Library</span>
                </button>
              )}
            </div>

            {/* Assets */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-4">Upload Assets (Max 3)</label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {uploadedAssets.map((asset, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <img src={asset} className="w-full h-full object-cover" alt="Asset" />
                    <button onClick={() => removeAsset(idx)} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="material-symbols-outlined text-white">delete</span></button>
                  </div>
                ))}
                {uploadedAssets.length < 3 && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 flex items-center justify-center text-text-secondary transition-all"><span className="material-symbols-outlined">add_a_photo</span></button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
            </div>

            <div className="relative group/prompt">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-black uppercase tracking-widest text-text-secondary block">Prompt</label>
                <button 
                  onClick={handleMagicPrompt}
                  disabled={isEnhancing || !prompt}
                  title="Magic Enhance Prompt"
                  className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isEnhancing ? 'animate-spin' : ''}`}>auto_awesome</span>
                </button>
              </div>
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="Describe your video idea..." 
                className="w-full h-32 p-4 bg-surface-light border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all placeholder:text-text-secondary/40" 
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-4">Visual Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full h-12 px-4 bg-surface-light border border-white/5 rounded-xl text-white appearance-none cursor-pointer focus:ring-2 focus:ring-primary">
                <option>MrBeast Style (High Saturation)</option>
                <option>Dark Horror & Gritty</option>
                <option>Tech Futuristic & Clean</option>
                <option>Anime / Manga Style</option>
              </select>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full h-16 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-black rounded-2xl shadow-neon transition-all flex items-center justify-center gap-2">
              {isGenerating ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Processing...</> : <><span className="material-symbols-outlined">auto_awesome</span>Generate 3 Variations</>}
            </button>
            {error && <p className="text-red-400 text-xs font-bold mt-4">{error}</p>}
          </div>
        </aside>

        {/* Output Grid */}
        <main className="flex-1 bg-background p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Creative Output</h2>
                <p className="text-sm text-text-secondary">Polished results for your next viral hit.</p>
              </div>
            </header>

            {isGenerating ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map(i => (
                  <div key={i} className="aspect-video rounded-2xl bg-surface-light border border-white/5 flex flex-col items-center justify-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-[10px] font-black text-text-secondary uppercase">Crafting Var {i+1}</p>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                {results.map((url, idx) => (
                  <div key={idx} className="flex flex-col gap-4 group">
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-lg group-hover:shadow-neon transition-all group-hover:-translate-y-1">
                      <img src={url} className="w-full h-full object-cover" alt={`Variation ${idx+1}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                        <button 
                          onClick={() => openPreview(idx)}
                          className="px-4 h-10 rounded-xl bg-white text-black flex items-center justify-center gap-2 hover:scale-105 transition-transform font-bold text-xs"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          Preview
                        </button>
                        <button 
                          onClick={() => openEditor(idx)}
                          className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                <span className="material-symbols-outlined text-6xl mb-4">art_track</span>
                <p className="text-sm text-text-secondary">Start by picking a template or typing a prompt.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
          <div className="bg-surface w-full max-w-5xl max-h-[85vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Choose a Template</h2>
                <p className="text-sm text-text-secondary">Kickstart your generation with a proven viral layout.</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEMPLATES.map((t) => (
                  <div key={t.id} onClick={() => selectTemplate(t)} className="group cursor-pointer rounded-2xl overflow-hidden border border-white/5 bg-surface-light hover:border-primary transition-all hover:scale-[1.02]">
                    <div className="aspect-video relative overflow-hidden">
                      <img src={t.imageUrl} className="w-full h-full object-cover" alt={t.title} />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="px-4 py-2 bg-white text-black font-black text-xs rounded-full shadow-lg">Select This</span></div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-black uppercase text-primary tracking-widest mb-1">{t.category}</p>
                      <h4 className="font-bold text-sm leading-tight line-clamp-1">{t.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced YouTube Preview Modal */}
      {previewingIndex !== null && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-fade-in">
          <div className="w-full max-w-6xl h-[90vh] flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: Player & Context */}
            <div className="flex-1 bg-surface-light rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">smart_display</span>
                  <span className="font-black text-xs tracking-widest uppercase opacity-70">YouTube Context Mockup</span>
                </div>
                <button onClick={() => setPreviewingIndex(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-[20px]">close</span></button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                {/* Main Player Area */}
                <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl bg-black relative group mb-8">
                  <img src={results[previewingIndex]} className="w-full h-full object-cover" alt="Selected Variation" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm duration-300">
                    <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                      <span className="material-symbols-outlined text-white text-5xl fill-1">play_arrow</span>
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-6 bg-black/90 px-3 py-1.5 rounded-lg text-xs font-black shadow-lg">12:45</div>
                </div>

                {/* Video Info - Mocking UI from Screenshot */}
                <div className="space-y-6">
                   <div className="bg-[#1a1a20] p-5 rounded-2xl border border-white/5">
                      <h1 className="text-2xl font-black text-white leading-tight">
                        {isSuggestionsLoading ? "Optimizing viral title..." : (suggestions?.titles[previewingIndex] || "Video Title Drafting...")}
                      </h1>
                   </div>

                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 border border-white/10 flex items-center justify-center font-black text-primary overflow-hidden">
                           <img src={user.avatar} className="w-full h-full object-cover" alt="Channel" />
                        </div>
                        <div>
                           <h4 className="font-bold text-sm text-white flex items-center gap-2">
                             {user.name}
                             <span className="material-symbols-outlined text-[14px] text-blue-400 fill-1">verified</span>
                           </h4>
                           <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest mt-0.5">2.4M subscribers</p>
                        </div>
                        <button className="h-9 px-6 bg-white text-black text-xs font-black rounded-full ml-4 hover:bg-gray-200 transition-colors">Subscribe</button>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        <div className="flex bg-white/5 rounded-full h-10 px-4 items-center gap-4 border border-white/5">
                           <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                              <span className="text-xs font-bold">128K</span>
                           </div>
                           <div className="w-px h-4 bg-white/10"></div>
                           <span className="material-symbols-outlined text-[20px] cursor-pointer hover:text-red-400">thumb_down</span>
                        </div>
                        <div className="bg-white/5 rounded-full h-10 w-10 flex items-center justify-center border border-white/5 hover:bg-white/10 cursor-pointer">
                           <span className="material-symbols-outlined text-[18px]">share</span>
                        </div>
                     </div>
                   </div>

                   <div className="p-6 rounded-2xl bg-white/5 text-sm text-text-secondary leading-relaxed border border-white/5">
                      <div className="flex gap-4 font-bold text-white mb-2 text-xs uppercase tracking-widest">
                        <span>1.2M views</span>
                        <span>2 hours ago</span>
                      </div>
                      <p className="text-sm">
                        {isSuggestionsLoading ? "Generating context-aware description..." : suggestions?.description}
                      </p>
                      <button className="text-white font-bold mt-4 hover:underline text-xs">...Show more</button>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Recommendations & Actions */}
            <aside className="w-full lg:w-[420px] flex flex-col gap-6">
              <div className="bg-surface border border-white/10 rounded-3xl p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col shadow-neon-strong">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  AI Video Recommendations
                </h3>
                
                <div className="space-y-4 flex-1">
                  {results.map((url, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setPreviewingIndex(idx)}
                      className={`group cursor-pointer p-3 rounded-2xl border transition-all duration-300 ${idx === previewingIndex ? 'bg-primary/10 border-primary/50 shadow-neon scale-[1.02]' : 'border-white/5 hover:bg-white/5'}`}
                    >
                      <div className="flex gap-4">
                         <div className="w-32 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                            <img src={url} className={`w-full h-full object-cover transition-opacity duration-300 ${idx === previewingIndex ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} alt={`Variation ${idx}`} />
                            <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-[8px] px-1.5 py-0.5 rounded font-black shadow-lg">12:45</div>
                         </div>
                         <div className="flex-1 py-1">
                           <h4 className={`text-[13px] font-bold leading-tight line-clamp-2 transition-colors duration-300 ${idx === previewingIndex ? 'text-primary' : 'text-white'}`}>
                             {suggestions?.titles[idx] || `Viral Variation #${idx + 1}`}
                           </h4>
                           <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] text-text-secondary uppercase font-black tracking-widest">Score:</span>
                              <span className="text-[9px] text-primary font-black">{(98 - idx * 3)}%</span>
                              <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-primary" style={{ width: `${98 - idx * 3}%` }}></div>
                              </div>
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-8 mt-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest mb-4">CTR Performance Prediction</p>
                    <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-400 shadow-neon transition-all duration-1000" style={{ width: `${88 - (previewingIndex || 0) * 5}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-3">
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">Explosive Trend</span>
                      <span className="text-[10px] font-black text-white">{8.8 - (previewingIndex || 0) * 0.5}% - {12.4 - (previewingIndex || 0) * 0.5}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                  <button 
                    onClick={() => downloadImage(results[previewingIndex || 0], previewingIndex || 0)}
                    className="w-full h-18 bg-white text-black font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span className="material-symbols-outlined">download</span>
                    Download 4K Thumbnail
                  </button>
                  <button 
                    onClick={() => setPreviewingIndex(null)}
                    className="w-full h-14 bg-white/5 text-text-secondary font-black rounded-2xl hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
                  >
                    Back to Generator
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Advanced Studio Editor Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="w-full h-full flex flex-col md:flex-row">
            {/* Left: Viewport */}
            <div className="flex-1 p-12 flex flex-col items-center justify-center relative bg-background/50">
              <div className="absolute top-10 left-10 flex items-center gap-6">
                <button onClick={() => setEditingIndex(null)} className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all active:scale-90"><span className="material-symbols-outlined text-2xl">close</span></button>
                <div>
                   <h3 className="text-2xl font-black">Studio Studio</h3>
                   <p className="text-[10px] text-primary uppercase font-black tracking-[0.3em]">Variation #{editingIndex + 1}</p>
                </div>
              </div>
              
              <div 
                className="relative max-w-full max-h-[75vh] aspect-video rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(140,37,244,0.4)] ring-8 ring-primary/20 transition-all duration-200" 
                style={{ 
                  filter: `brightness(${editSettings.brightness}%) contrast(${editSettings.contrast}%) saturate(${editSettings.saturate}%) hue-rotate(${editSettings.hue}deg) blur(${editSettings.blur}px)`, 
                  transform: `rotate(${editSettings.rotation}deg) scale(${editSettings.zoom})` 
                }}
              >
                <img src={results[editingIndex]} className="w-full h-full object-contain" alt="Studio Preview" />
              </div>
            </div>

            {/* Right: Studio Controls */}
            <aside className="w-full md:w-[500px] bg-surface border-l border-white/10 p-12 overflow-y-auto custom-scrollbar flex flex-col gap-14">
              <div className="flex-1">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-12 flex items-center gap-3">
                  <span className="material-symbols-outlined text-base">tune</span>
                  Visual Tuning
                </h4>
                
                <div className="space-y-12">
                  <EditorSlider label="Exposure" value={editSettings.brightness} min={50} max={180} onChange={(v: number) => setEditSettings({...editSettings, brightness: v})} />
                  <EditorSlider label="Punch / Contrast" value={editSettings.contrast} min={50} max={200} onChange={(v: number) => setEditSettings({...editSettings, contrast: v})} />
                  <EditorSlider label="Color Pop" value={editSettings.saturate} min={0} max={250} onChange={(v: number) => setEditSettings({...editSettings, saturate: v})} />
                  <EditorSlider label="Mood / Hue" value={editSettings.hue} min={0} max={360} unit="°" onChange={(v: number) => setEditSettings({...editSettings, hue: v})} />
                  <EditorSlider label="Atmosphere / Blur" value={editSettings.blur} min={0} max={20} step={0.2} unit="px" onChange={(v: number) => setEditSettings({...editSettings, blur: v})} />
                  <EditorSlider label="Frame Scale" value={editSettings.zoom} min={1} max={3.5} step={0.01} unit="x" onChange={(v: number) => setEditSettings({...editSettings, zoom: v})} />
                </div>

                <div className="mt-16 pt-12 border-t border-white/5">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-base">transform</span>
                    Canvas Geometry
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => setEditSettings({...editSettings, rotation: (editSettings.rotation - 90)})} className="h-16 rounded-2xl bg-surface-light border border-white/10 flex items-center justify-center gap-3 transition-all hover:border-primary/50 hover:bg-white/10 active:scale-95 font-black text-xs uppercase tracking-widest"><span className="material-symbols-outlined text-lg">rotate_left</span>Rotate L</button>
                    <button onClick={() => setEditSettings({...editSettings, rotation: (editSettings.rotation + 90)})} className="h-16 rounded-2xl bg-surface-light border border-white/10 flex items-center justify-center gap-3 transition-all hover:border-primary/50 hover:bg-white/10 active:scale-95 font-black text-xs uppercase tracking-widest"><span className="material-symbols-outlined text-lg">rotate_right</span>Rotate R</button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <button 
                  onClick={saveEdits} 
                  className="w-full h-20 bg-primary hover:bg-primary-hover text-white font-black text-xl rounded-3xl shadow-neon flex items-center justify-center gap-4 transition-all hover:scale-[1.03] active:scale-95 group"
                >
                  <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">check_circle</span>
                  Commit Changes
                </button>
                <button 
                  onClick={() => setEditingIndex(null)} 
                  className="w-full h-14 bg-surface-light border border-white/10 text-text-secondary font-black text-xs uppercase tracking-widest rounded-2xl hover:text-white hover:bg-white/10 transition-all"
                >
                  Discard Studio Sessions
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

const EditorSlider = ({ label, value, min, max, step = 1, unit = "%", onChange }: any) => (
  <div className="space-y-5 group">
    <div className="flex justify-between text-[10px] font-black tracking-[0.2em] uppercase">
      <span className="text-text-secondary group-hover:text-primary transition-colors">{label}</span>
      <span className="text-primary">{unit === "%" ? Math.round(value) : value}{unit}</span>
    </div>
    <div className="relative flex items-center">
       <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        className="w-full h-2.5 bg-background rounded-full appearance-none cursor-pointer accent-primary border border-white/5" 
      />
    </div>
  </div>
);

export default GeneratorPage;
