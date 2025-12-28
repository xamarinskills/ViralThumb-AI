
import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '../components/Layout';
import { User, Thumbnail } from '../types';
import { generateThumbnailVariation, generateVideoSuggestions, enhancePrompt, analyzeThumbnailCTR } from '../services/gemini';
import { supabase, isSupabaseConfigured, deductCredits, saveThumbnailsToDB } from '../services/supabase';

interface GeneratorPageProps {
  user: User | null;
  onNavigate: (page: any) => void;
  onLogout?: () => void;
}

interface AnalysisResult {
  score: number;
  label: string;
  feedback: string;
}

const GeneratorPage: React.FC<GeneratorPageProps> = ({ user, onNavigate, onLogout }) => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("MrBeast Style (High Saturation)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{ titles: string[], description: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [editedTitles, setEditedTitles] = useState<string[]>([]);
  
  const [analysis, setAnalysis] = useState<Record<number, AnalysisResult>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<number, boolean>>({});
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle credits locally for immediate UI update
  const [localCredits, setLocalCredits] = useState(user?.credits || 0);

  useEffect(() => {
    if (user) setLocalCredits(user.credits);
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedAssets(prev => [...prev, reader.result as string].slice(0, 3));
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!prompt || !user) return;
    if (localCredits <= 0) {
      alert("Insufficient credits. Please upgrade your plan.");
      return;
    }
    
    setIsGenerating(true);
    setResults([]);
    setAnalysis({});
    setSuggestions(null);

    try {
      const variationUrls: string[] = [];
      // Generate 3 variations
      for (let i = 0; i < 3; i++) {
        const img = await generateThumbnailVariation(prompt, style, uploadedAssets, i);
        if (img) {
          variationUrls.push(img);
          setResults(prev => [...prev, img]);
        }
      }

      // Generate clickbait titles
      const suggestionData = await generateVideoSuggestions(prompt, style, variationUrls);
      setSuggestions(suggestionData);
      setEditedTitles(suggestionData.titles);

      // Deduct credits & Save to DB
      if (user.id !== 'mock-id') {
        const newCredits = await deductCredits(user.id, localCredits);
        setLocalCredits(newCredits);
        await saveThumbnailsToDB(user.id, variationUrls.map((url, i) => ({
          url,
          prompt,
          style,
          title: suggestionData.titles[i]
        })));
      } else {
        setLocalCredits(prev => prev - 1);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const runAnalysis = async (index: number) => {
    if (isAnalyzing[index]) return;
    setIsAnalyzing(prev => ({ ...prev, [index]: true }));
    try {
      const res = await analyzeThumbnailCTR(results[index], prompt);
      setAnalysis(prev => ({ ...prev, [index]: res }));
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [index]: false }));
    }
  };

  const downloadSelected = () => {
    if (results.length === 0) return;
    const link = document.createElement('a');
    link.href = results[selectedIndex];
    link.download = `ViralThumb_${selectedIndex + 1}.png`;
    link.click();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar onNavigate={onNavigate} variant="app" user={{ ...user, credits: localCredits }} onLogout={onLogout} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-[360px] border-r border-white/5 bg-surface p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar shrink-0">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Source Assets</h2>
            <div className="grid grid-cols-3 gap-2">
              {uploadedAssets.map((asset, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                  <img src={asset} className="w-full h-full object-cover" />
                  <button onClick={() => setUploadedAssets(p => p.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">delete</span>
                  </button>
                </div>
              ))}
              {uploadedAssets.length < 3 && (
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-primary flex items-center justify-center text-text-secondary">
                  <span className="material-symbols-outlined">add</span>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Core Concept</label>
              <button 
                onClick={async () => {
                  if (!prompt) return;
                  setIsEnhancing(true);
                  const enhanced = await enhancePrompt(prompt);
                  setPrompt(enhanced);
                  setIsEnhancing(false);
                }}
                disabled={isEnhancing || !prompt}
                className="text-[10px] font-black text-primary hover:underline uppercase disabled:opacity-30"
              >
                {isEnhancing ? 'Enhancing...' : 'Magic Prompt'}
              </button>
            </div>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="What is your video about? (e.g. 'I spent 24 hours in a locked mall')"
              className="w-full h-32 p-4 bg-surface-light border border-white/5 rounded-xl text-white outline-none focus:ring-1 focus:ring-primary/50 text-sm resize-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Aesthetic Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full h-12 px-4 bg-surface-light border border-white/5 rounded-xl text-sm outline-none">
              <option>MrBeast Style (Shock & Saturation)</option>
              <option>Modern Tech (Clean & High Contrast)</option>
              <option>Gaming (Action & Neon)</option>
              <option>Documentary (Dramatic & Moody)</option>
            </select>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt}
            className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black rounded-xl shadow-neon transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <><span className="material-symbols-outlined">bolt</span> Generate Variations</>
            )}
          </button>
        </aside>

        {/* Workspace Area */}
        <main className="flex-1 bg-background overflow-y-auto p-8 flex flex-col items-center">
          {results.length > 0 ? (
            <div className="w-full max-w-6xl space-y-12">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* 16:9 YouTube Preview */}
                <div className="flex-1 space-y-6">
                  <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl relative group ring-1 ring-white/10">
                    <img src={results[selectedIndex]} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                      LIVE PREVIEW
                    </div>
                  </div>

                  {/* Meta Controls */}
                  <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Viral Title</label>
                        <input 
                          type="text" 
                          value={editedTitles[selectedIndex] || ""}
                          onChange={(e) => {
                            const newTitles = [...editedTitles];
                            newTitles[selectedIndex] = e.target.value;
                            setEditedTitles(newTitles);
                          }}
                          className="w-full bg-transparent text-xl font-bold border-b border-white/10 pb-2 outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div className="text-right">
                        {analysis[selectedIndex] ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            <span className="text-sm font-black">{analysis[selectedIndex].score}% CTR</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => runAnalysis(selectedIndex)}
                            disabled={isAnalyzing[selectedIndex]}
                            className="text-[10px] font-black text-primary hover:underline uppercase"
                          >
                            {isAnalyzing[selectedIndex] ? 'Calculating...' : 'AI Analysis'}
                          </button>
                        )}
                      </div>
                    </div>

                    {analysis[selectedIndex] && (
                      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-xs text-text-secondary italic">
                        <span className="font-bold text-primary not-italic mr-1">Algorithm Tip:</span>
                        {analysis[selectedIndex].feedback}
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={downloadSelected}
                        className="flex-1 h-14 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                      >
                        <span className="material-symbols-outlined">download</span> Export Thumbnail
                      </button>
                      <button className="h-14 px-6 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">share</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variation Side Selector */}
                <div className="w-full lg:w-72 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Variations</h3>
                  <div className="flex flex-col gap-4">
                    {results.map((url, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedIndex(idx)}
                        className={`group relative aspect-video rounded-2xl cursor-pointer overflow-hidden border-2 transition-all duration-300 ${selectedIndex === idx ? 'border-primary shadow-neon scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">Select</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Realistic YouTube Context Preview */}
              <section className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-center">Context Preview: How it looks on Home Feed</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 scale-95 origin-top">
                  {/* The Current Variation */}
                  <div className="space-y-3">
                    <div className="aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
                       <img src={results[selectedIndex]} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                       <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xs shrink-0">VS</div>
                       <div className="flex-1">
                          <h4 className="font-bold text-[14px] leading-tight mb-1">{editedTitles[selectedIndex]}</h4>
                          <p className="text-[12px] text-text-secondary">ViralThumb AI • 120k views • 2 hours ago</p>
                       </div>
                    </div>
                  </div>
                  {/* Competitor A */}
                  <div className="space-y-3 grayscale opacity-40">
                    <div className="aspect-video rounded-xl overflow-hidden bg-surface-light border border-white/5">
                       <img src="https://picsum.photos/seed/comp1/800/450" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-700 shrink-0"></div>
                       <div className="flex-1">
                          <h4 className="font-bold text-[14px] leading-tight mb-1">Generic Content Title #1</h4>
                          <p className="text-[12px] text-text-secondary">Other Channel • 10k views • 1 day ago</p>
                       </div>
                    </div>
                  </div>
                  {/* Competitor B */}
                  <div className="space-y-3 grayscale opacity-40">
                    <div className="aspect-video rounded-xl overflow-hidden bg-surface-light border border-white/5">
                       <img src="https://picsum.photos/seed/comp2/800/450" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-700 shrink-0"></div>
                       <div className="flex-1">
                          <h4 className="font-bold text-[14px] leading-tight mb-1">Another Average Video Title</h4>
                          <p className="text-[12px] text-text-secondary">Low CTR Channel • 500 views • 5 hours ago</p>
                       </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
               {isGenerating ? (
                  <div className="space-y-6">
                    <div className="w-24 h-24 relative mx-auto">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-neon"></div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black mb-2 animate-pulse">Consulting the Algorithm...</h2>
                      <p className="text-text-secondary">We are generating 3 distinct visual strategies for your concept.</p>
                    </div>
                  </div>
               ) : (
                  <div className="max-w-md space-y-6 opacity-30">
                    <span className="material-symbols-outlined text-8xl">auto_awesome</span>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Workspace Ready</h2>
                      <p className="text-sm">Upload a face photo or type a concept to start generating your viral pack.</p>
                    </div>
                  </div>
               )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GeneratorPage;
