
import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '../components/Layout';
import { User, Thumbnail } from '../types';
import { generateThumbnailVariation, generateVideoSuggestions, enhancePrompt, analyzeThumbnailCTR } from '../services/gemini';
import { supabase, isSupabaseConfigured, deductCredits, saveThumbnailsToDB, saveGenerationToDB, uploadImageToStorage, TemplateRecord, getUserGenerations } from '../services/supabase';
import TemplatePicker from '../components/TemplatePicker';
import YouTubeWatchPreview from '../components/YouTubeWatchPreview';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{ titles: string[], description: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [editedTitles, setEditedTitles] = useState<string[]>([]);
  const [editedDescriptions, setEditedDescriptions] = useState<string[]>([]);
  const [showPreviewIndex, setShowPreviewIndex] = useState<number | null>(null);
  const [watchInlineOpen, setWatchInlineOpen] = useState<boolean>(false);
  const [youTubePreviewActive, setYouTubePreviewActive] = useState<boolean>(false);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [outOfCreditsOpen, setOutOfCreditsOpen] = useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [loaderSyncStart, setLoaderSyncStart] = useState<number | null>(null);

  const [analysis, setAnalysis] = useState<Record<number, AnalysisResult>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<number, boolean>>({});
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  const [historyRows, setHistoryRows] = useState<any[]>([]);
  const [historicalPreviewUrl, setHistoricalPreviewUrl] = useState<string | null>(null);
  const [historicalPreviewTitle, setHistoricalPreviewTitle] = useState<string>('');
  const [historicalPreviewDescription, setHistoricalPreviewDescription] = useState<string>('');
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle credits locally for immediate UI update
  const [localCredits, setLocalCredits] = useState(user?.credits || 0);

  useEffect(() => {
    if (user) setLocalCredits(user.credits);
  }, [user]);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryError(null);
      setHistoryLoading(true);
      try {
        if (!user || !isSupabaseConfigured || user.id === 'mock-id') {
          setHistoryRows([]);
          return;
        }
        const rows = await getUserGenerations(user.id, 200);
        setHistoryRows(rows || []);
      } catch (err: any) {
        setHistoryError(err?.message || 'Failed to load history');
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  const isGeneratedUrl = (u: string | undefined | null) => {
    if (!u || typeof u !== 'string') return false;
    const s = u.trim();
    if (s.length === 0) return false;
    if (/^data:image\//i.test(s)) return true;
    if (/storage\/v1\/object\/public\//i.test(s)) return true;
    if (/\.(png|jpg|jpeg|webp)$/i.test(s)) return true;
    return false;
  };

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 200);
    return () => clearTimeout(t);
  }, [results, historyRows]);

  useEffect(() => {
    if (localCredits === 0) {
      setOutOfCreditsOpen(true);
    }
  }, [localCredits]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOutOfCreditsOpen(false);
    };
    if (outOfCreditsOpen) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [outOfCreditsOpen]);

  const openYouTubePopup = () => {
    const currentUrl = results[selectedIndex];
    const title = editedTitles[selectedIndex] || `Watch This: ${prompt}`;
    const description = editedDescriptions[selectedIndex] || `This will blow your mind. Like, comment, and subscribe for more!`;
    const channel = user?.username || 'ViralThumb AI';

    const width = Math.max(800, 1000);
    const height = Math.max(600, 700);
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    const features = `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
    const popup = window.open('', 'YTPreviewWindow', features);
    if (!popup) return;

    popup.document.title = 'YouTube Preview';
    popup.document.body.setAttribute('aria-label', 'YouTube preview popup');
    popup.document.body.style.margin = '0';
    popup.document.body.style.background = 'rgb(15,15,15)';

    const head = popup.document.head;
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      head.appendChild(node.cloneNode(true));
    });

    const container = popup.document.createElement('div');
    container.id = 'popup-root';
    popup.document.body.appendChild(container);

    const closeBar = popup.document.createElement('div');
    closeBar.style.cssText = 'position:fixed;top:8px;right:8px;z-index:50';
    const closeBtn = popup.document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.setAttribute('aria-label', 'Close popup');
    closeBtn.style.cssText = 'height:36px;padding:0 12px;border-radius:18px;background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.2);cursor:pointer';
    closeBtn.onclick = () => popup.close();
    closeBar.appendChild(closeBtn);
    popup.document.body.appendChild(closeBar);

    const spinner = popup.document.createElement('div');
    spinner.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:white;opacity:0.7';
    spinner.innerText = 'Loading preview...';
    popup.document.body.appendChild(spinner);

    const root = createRoot(container);
    root.render(
      <YouTubeWatchPreview
        url={currentUrl || undefined as any}
        title={title}
        channel={channel}
        subscribersText={`${Math.floor(100000 + Math.random() * 900000).toLocaleString()} subscribers`}
        viewsText={`${Math.floor(50000 + Math.random() * 950000).toLocaleString()} views`}
        uploadedText={'2 hours ago'}
        description={description}
        suggestions={[
          ...results.filter((u) => isGeneratedUrl(u)).map((u, i) => ({
            url: u,
            title: editedTitles[i] || `Watch This: ${prompt}`,
            channel,
            views: Math.floor(100000 + Math.random() * 900000),
            uploadedText: 'Just now'
          })).reverse(),
          ...historyRows.filter((h) => isGeneratedUrl(h?.output_url)).map((h) => ({
            url: h.output_url,
            title: h.prompt || 'Generated Video',
            channel,
            views: Math.floor(100000 + Math.random() * 900000),
            uploadedText: 'Recently'
          }))
        ].filter((s) => !!s.url && s.url.trim() !== '' && isGeneratedUrl(s.url))}
        onSelectSuggestion={(i) => {
          const list = [
            ...results.filter((u) => isGeneratedUrl(u)).map((u) => u).reverse(),
            ...historyRows.filter((h) => isGeneratedUrl(h?.output_url)).map((h) => h.output_url)
          ].filter((u) => !!u && u.trim() !== '' && isGeneratedUrl(u));
          const selectedUrl = list[i];
          const idxInCurrent = results.findIndex((u) => u === selectedUrl);
          if (idxInCurrent >= 0) setSelectedIndex(idxInCurrent);
        }}
        onExit={() => popup.close()}
      />
    );
    setTimeout(() => {
      spinner.remove();
    }, 300);
    popup.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') popup.close();
    });
  };

  const showHistoricalPreview = (item: any) => {
    const url = typeof item === 'string' ? item : item?.output_url;
    const title = typeof item === 'string' ? '' : (item?.title || item?.prompt || '');
    const description = typeof item === 'string' ? '' : (item?.description || '');
    setHistoricalPreviewUrl(url || null);
    setHistoricalPreviewTitle(title || '');
    setHistoricalPreviewDescription(description || '');
  };

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
      setOutOfCreditsOpen(true);
      return;
    }

    setLoaderSyncStart(Date.now());
    setIsGenerating(true);
    setResults([]);
    setAnalysis({});
    setSuggestions(null);

    try {
      // 0. Verify sufficient credits (need at least 3 for 3 variations)
      if (localCredits < 3) {
        setOutOfCreditsOpen(true);
        setIsGenerating(false);
        return;
      }

      // 1. Generation Step: Get 3 variations from Gemini (Base64)
      const variationsBase64: string[] = [];
      for (let i = 0; i < 3; i++) {
        const img = await generateThumbnailVariation(prompt, style, uploadedAssets, i);
        if (img) {
          variationsBase64.push(img);
          // Show immediate local preview if possible (optional)
          setResults(prev => [...prev, img]);
        }
      }

      if (variationsBase64.length === 0) {
        throw new Error("No variations were generated. Please try a different prompt.");
      }

      // 2. Upload Step: Move to Supabase Storage
      const permanentUrls: string[] = [];
      if (user.id !== 'mock-id') {
        setResults([]); // Clear results to show "Processing/Uploading" state if desired

        for (let i = 0; i < variationsBase64.length; i++) {
          const genId = crypto.randomUUID();
          try {
            console.log(`Uploading variation ${i + 1}/3...`);
            const { publicUrl } = await uploadImageToStorage(user.id, genId, variationsBase64[i]);
            permanentUrls.push(publicUrl);
          } catch (err) {
            console.error(`Failed to upload variation ${i + 1}`, err);
            // In a production app, we might want to retry or block here.
            // For now, we'll keep the local URL as fallback if upload fails
            permanentUrls.push(variationsBase64[i]);
          }
        }
      } else {
        // Mock mode: Just use base64
        permanentUrls.push(...variationsBase64);
        setLocalCredits(prev => Math.max(0, prev - 3));
      }

      setResults(permanentUrls); // Update UI with permanent URLs

      // 3. Metadata Step: Titles and Suggestions
      const suggestionData = await generateVideoSuggestions(prompt, style, permanentUrls);
      setSuggestions(suggestionData);
      const clickbaitTitles = permanentUrls.map((_, i) => {
        const base = suggestionData?.titles?.[i];
        if (base && !/viral\s[a-z]/i.test(base)) return base;
        const core = prompt || 'This Changes Everything';
        const adj = ['SHOCKING', 'INSANE', 'UNBELIEVABLE', 'GENIUS', 'SECRET'][i % 5];
        return `${adj}: ${core} (${i + 1} Mind-Blowing Tips)`;
      });
      const clickbaitDescriptions = permanentUrls.map((_, i) => {
        const base = suggestionData?.description;
        const title = clickbaitTitles[i];
        return `${title}\n\nSmash LIKE if this surprised you and SUBSCRIBE for more! Comment your favorite part. Turn on notifications 🔔 to never miss out.`;
      });
      setEditedTitles(clickbaitTitles);
      setEditedDescriptions(clickbaitDescriptions);

      // 4. Persistence Step: Save to Database
      if (user.id !== 'mock-id') {
        const newCredits = await deductCredits(user.id, localCredits, 3);
        setLocalCredits(newCredits);

        // Save to thumbnails table
        await saveThumbnailsToDB(user.id, permanentUrls.map((url, i) => ({
          url,
          prompt,
          style,
          title: suggestionData.titles[i] || 'Untitled'
        })));

        // Save to history (generations table)
        for (let i = 0; i < permanentUrls.length; i++) {
          const url = permanentUrls[i];
          await saveGenerationToDB(
            user.id, 
            prompt, 
            url, 
            1,
            clickbaitTitles[i] || 'Untitled',
            clickbaitDescriptions[i] || ''
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Generation failed.");
    } finally {
      const elapsed = loaderSyncStart ? Date.now() - loaderSyncStart : 0;
      const minDuration = 1200;
      const waitMs = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        setIsGenerating(false);
        setLoaderSyncStart(null);
      }, waitMs);
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
      <Navbar onNavigate={onNavigate} variant="app" user={{ ...user, credits: localCredits }} onLogout={onLogout} activePage="generator" />

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-[360px] border-r border-white/5 bg-surface p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar shrink-0">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Source Assets</h2>
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {uploadedAssets.map((asset, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group shadow-lg"
                  >
                    <img src={asset} className="w-full h-full object-cover" />
                    <button onClick={() => setUploadedAssets(p => p.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <span className="material-symbols-outlined text-white text-sm">delete</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {uploadedAssets.length < 3 && (
                <motion.button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-text-secondary transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="material-symbols-outlined">add</span>
                </motion.button>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" multiple />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Core Concept</label>
              <motion.button
                onClick={async () => {
                  if (!prompt) return;
                  setIsEnhancing(true);
                  const enhanced = await enhancePrompt(prompt);
                  setPrompt(enhanced);
                  setIsEnhancing(false);
                }}
                disabled={isEnhancing || !prompt}
                className="text-[10px] font-black text-primary hover:text-primary-hover uppercase disabled:opacity-30 flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[12px]">{isEnhancing ? 'auto_awesome' : 'magic_button'}</span>
                {isEnhancing ? 'Enhancing...' : 'Magic Prompt'}
              </motion.button>
            </div>
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-600 rounded-xl opacity-0 group-focus-within:opacity-50 blur transition duration-500"></div>
                <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What is your video about? (e.g. 'I spent 24 hours in a locked mall')"
                className="relative w-full h-32 p-4 bg-surface-light border border-white/5 rounded-xl text-white outline-none focus:border-primary/50 text-sm resize-none transition-all placeholder:text-white/20"
                />
            </div>
          </div>

          <TemplatePicker
            value={selectedTemplate?.id || null}
            onChange={(t) => {
              setSelectedTemplate(t);
              if (t?.name) setStyle(t.name);
            }}
            className="space-y-2"
          />

          <div className="sticky bottom-0 z-10 pt-2 bg-gradient-to-t from-surface to-transparent">
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt || outOfCreditsOpen}
              className="relative group w-full h-[4.2rem] overflow-hidden bg-gradient-to-r from-primary to-indigo-500 hover:from-primary-hover hover:to-indigo-600 text-white font-black rounded-2xl shadow-neon disabled:opacity-50 flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Generate Viral Options"
              title={
                isGenerating
                  ? 'Generating...'
                  : (!prompt ? 'Enter a core concept to enable' : (localCredits < 3 ? 'Requires 3 credits' : undefined))
              }
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3">
                  {isGenerating ? (
                  <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      <span className="animate-pulse">Generating...</span>
                  </>
                  ) : (
                  <>
                      <span className="material-symbols-outlined group-hover:animate-bounce">bolt</span>
                      <span>Generate Viral Options</span>
                      <span className="ml-1 px-2 py-1 bg-black/20 rounded-lg text-xs font-bold text-white/90">
                        3 Credits
                      </span>
                  </>
                  )}
              </div>
            </motion.button>
          </div>
        </aside>

        {/* Workspace Area */}
        <main className="flex-1 bg-background overflow-y-auto p-8 flex flex-col items-center relative">
          {historyRows.length > 0 && (
            <div className="w-full max-w-6xl mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white/90">Recent Generations</h3>
                <button 
                  onClick={() => {/* TODO: Implement view all */}}
                  className="text-xs font-medium text-primary hover:text-white transition-colors flex items-center gap-1 group"
                >
                  View All 
                  <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
              {isFiltering && (
                <div className="mb-2 text-xs text-text-secondary">Filtering generated images...</div>
              )}
              
              {historyLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar" aria-busy="true" aria-live="polite">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="w-[160px] h-[90px] rounded-xl bg-white/5 animate-pulse shrink-0" aria-hidden="true" />
                  ))}
                </div>
              ) : historyError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {historyError}
                </div>
              ) : (
                <div
                  className="flex gap-4 overflow-x-auto pb-4 scroll-smooth custom-scrollbar"
                  role="list"
                  aria-label="History thumbnails list"
                >
                  {historyRows.filter((h) => isGeneratedUrl(h?.output_url)).map((h, i) => (
                    <motion.button
                      key={`${h.id || i}`}
                      onClick={() => showHistoricalPreview(h)}
                      className="relative w-[160px] h-[90px] rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0 group"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
                        borderColor: "rgba(255,255,255,0.2)" 
                      }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Open historical preview"
                      role="listitem"
                    >
                      {h.output_url ? (
                        <>
                          <img
                            src={h.output_url}
                            width={160}
                            height={90}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover bg-black transition-transform duration-500 group-hover:scale-110"
                            alt="History thumbnail"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-2xl drop-shadow-lg">play_circle</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white/20">broken_image</span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
          <AnimatePresence>
            {outOfCreditsOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
                onClick={() => setOutOfCreditsOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="w-full max-w-md rounded-3xl bg-surface ring-1 ring-white/10 shadow-2xl p-6 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-yellow-400">workspace_premium</span>
                  </div>
                  <h3 className="text-2xl font-black text-center mb-2">You’ve Hit Your Free Limit</h3>
                  <p className="text-text-secondary text-center mb-6">
                    You’ve created some amazing designs. Upgrade to Pro to unlock unlimited generations and remove all limits.
                  </p>
                  <motion.button
                    onClick={() => onNavigate('pricing' as any)}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black shadow-neon hover:from-primary-hover hover:to-indigo-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="material-symbols-outlined align-middle mr-1">rocket</span>
                    Upgrade Plan
                  </motion.button>
                  <button
                    onClick={() => onNavigate('pricing' as any)}
                    className="mt-3 w-full text-center text-sm text-text-secondary hover:text-white"
                  >
                    See pricing
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* {historicalPreviewUrl && (
              <div
                className="w-full max-w-6xl mb-6"
                aria-label="Historical preview container"
              >
                {/* <div className="relative aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-yellow-400/40 transition-all">
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-[11px] font-bold">
                    Historical Preview
                  </div>
                  <button
                    onClick={() => setHistoricalPreviewUrl(null)}
                    className="absolute top-3 right-3 h-8 px-3 rounded-full bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 hover:text-red-200 text-[11px] font-bold"
                    aria-label="Close historical preview"
                  >
                    Close
                  </button>
                  {/* {historicalPreviewUrl ? (
                    <YouTubeWatchPreview
                      url={historicalPreviewUrl}
                      title={historicalPreviewTitle || 'Historical Preview'}
                      channel={user?.username || 'ViralThumb AI'}
                      subscribersText={`${Math.floor(100000 + Math.random() * 900000).toLocaleString()} subscribers`}
                      viewsText={`${Math.floor(50000 + Math.random() * 950000).toLocaleString()} views`}
                      uploadedText={'Recently'}
                      description={historicalPreviewDescription || ''}
                      suggestions={
                        historyRows
                          .map((h) => ({
                            url: h.output_url,
                            title: h.title || h.prompt || 'Generated Video',
                            channel: h.description || (user?.username || 'ViralThumb AI'),
                            views: Math.floor(10000 + Math.random() * 900000),
                            uploadedText: 'Recently'
                          }))
                          .filter((s) => !!s.url && s.url.trim() !== '')
                      }
                      onSelectSuggestion={(i) => {
                        const list = historyRows.map((h) => h.output_url).filter((u: string) => !!u && u.trim() !== '');
                        const selectedUrl = list[i];
                        const idxInCurrent = results.findIndex((u) => u === selectedUrl);
                        if (idxInCurrent >= 0) setSelectedIndex(idxInCurrent);
                      }}
                      onExit={() => setHistoricalPreviewUrl(null)}
                    />
                  ) : null}
                </div> 
              </div>
            )} */}
          {results.length > 0 ? (
            <div className="w-full max-w-6xl space-y-6">
              {watchInlineOpen && (
                <YouTubeWatchPreview
                  url={results[selectedIndex] || undefined as any}
                  title={editedTitles[selectedIndex] || `Watch This: ${prompt}`}
                  channel={user?.username || 'ViralThumb AI'}
                  subscribersText={`${Math.floor(100000 + Math.random() * 900000).toLocaleString()} subscribers`}
                  viewsText={`${Math.floor(50000 + Math.random() * 950000).toLocaleString()} views`}
                  uploadedText={'2 hours ago'}
                  description={editedDescriptions[selectedIndex] || `This will blow your mind. Like, comment, and subscribe for more!`}
                  suggestions={[
                    ...results.filter((u) => isGeneratedUrl(u)).map((u, i) => ({
                      url: u,
                      title: editedTitles[i] || `Watch This: ${prompt}`,
                      channel: user?.username || 'ViralThumb AI',
                      views: Math.floor(10000 + Math.random() * 900000),
                      uploadedText: 'Just now'
                    })).reverse(),
                    ...historyRows.filter((h) => isGeneratedUrl(h?.output_url)).map((h) => ({
                      url: h.output_url,
                      title: h.prompt || 'Generated Video',
                      channel: user?.username || 'ViralThumb AI',
                      views: Math.floor(10000 + Math.random() * 900000),
                      uploadedText: 'Recently'
                    }))
                  ].filter((s) => !!s.url && s.url.trim() !== '' && isGeneratedUrl(s.url))}
                  onSelectSuggestion={(i) => {
                    const list = [
                      ...results.filter((u) => isGeneratedUrl(u)).map((u) => u).reverse(),
                      ...historyRows.filter((h) => isGeneratedUrl(h?.output_url)).map((h) => h.output_url)
                    ].filter((u) => !!u && u.trim() !== '' && isGeneratedUrl(u));
                    const selectedUrl = list[i];
                    const idxInCurrent = results.findIndex((u) => u === selectedUrl);
                    if (idxInCurrent >= 0) setSelectedIndex(idxInCurrent);
                  }}
                  onOpenPopup={openYouTubePopup}
                />
              )}
              {results.map((url, idx) => {
                if (!isGeneratedUrl(url)) return null;
                const title = editedTitles[idx] || `Watch This: ${prompt}`;
                const description = editedDescriptions[idx] || `This will blow your mind. Like, comment, and subscribe for more!`;
                const channel = user?.username || 'ViralThumb AI';
                const views = Math.floor(10000 + Math.random() * 900000);
                const uploaded = new Date(Date.now() - (idx + 1) * 3600_000);
                const rel = uploaded.toLocaleDateString();
                const mins = Math.floor(5 + Math.random() * 15);
                const secs = String(Math.floor(Math.random() * 60)).padStart(2, '0');
                const duration = `${mins}:${secs}`;
                return (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-2xl border border-white/10 bg-surface group hover:border-primary/20 transition-all"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-black shrink-0 shadow-lg">{channel[0]?.toUpperCase()}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold leading-tight text-white group-hover:text-primary transition-colors">{title}</h3>
                            {analysis[idx] && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[11px] font-bold"
                              >
                                {analysis[idx].score}% CTR
                              </motion.div>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">{channel} • {views.toLocaleString()} views • {rel}</p>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                      <div className="flex gap-3 mt-auto">
                        <motion.button
                          onClick={() => { setSelectedIndex(idx); runAnalysis(idx); }}
                          disabled={isAnalyzing[idx]}
                          className="h-10 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isAnalyzing[idx] ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">analytics</span>}
                          {isAnalyzing[idx] ? 'Analyzing...' : 'AI CTR Check'}
                        </motion.button>
                        <motion.button
                          onClick={() => { setSelectedIndex(idx); downloadSelected(); }}
                          className="h-10 px-4 rounded-xl bg-white text-black font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Download
                        </motion.button>
                      </div>
                    </div>
                    <div className="group/image relative aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl">
                      {url ? (
                        <img src={url} alt="Generated thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105" />
                      ) : null}
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm">{duration}</div>
                      <div className={`absolute inset-0 bg-black/40 opacity-0 ${isGenerating && youTubePreviewActive ? 'pointer-events-none' : 'group-hover/image:opacity-100'} transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]`}>
                        <motion.button
                          onClick={() => { setSelectedIndex(idx); }}
                          className="h-10 px-4 rounded-xl bg-white text-black font-black text-[11px] uppercase tracking-widest shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Edit this image"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => { setSelectedIndex(idx); setWatchInlineOpen(true); setYouTubePreviewActive(true); }}
                          className="h-10 px-4 rounded-xl border border-white/10 bg-black/60 text-white font-black text-[11px] uppercase tracking-widest backdrop-blur-md hover:bg-black/80"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Open YouTube preview"
                        >
                          YouTube Preview
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="generating"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="space-y-8">
                    <div className="w-32 h-32 relative mx-auto">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(140,37,244,0.5)]"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className="material-symbols-outlined text-4xl text-primary animate-pulse">auto_awesome</span>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 animate-pulse">Consulting the Algorithm...</h2>
                      <p className="text-text-secondary text-lg max-w-md mx-auto">We are generating 3 distinct visual strategies optimized for high CTR.</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="max-w-md space-y-8">
                    <div className="w-40 h-40 mx-auto rounded-3xl bg-gradient-to-br from-surface-light to-surface border border-white/5 flex items-center justify-center shadow-2xl shadow-black/50 group hover:scale-105 transition-transform duration-500">
                      <span className="material-symbols-outlined text-8xl text-white/10 group-hover:text-primary/20 transition-colors duration-500">auto_awesome</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-3 text-white">Workspace Ready</h2>
                      <p className="text-text-secondary text-lg">Upload a face photo or type a concept to start generating your next viral thumbnail pack.</p>
                    </div>
                    <div className="flex justify-center gap-3">
                       <button onClick={() => setPrompt("Surprised Face")} className="px-4 py-2 rounded-full bg-surface-light border border-white/5 hover:border-primary/50 hover:text-white text-text-secondary text-xs font-bold transition-all">Try "Surprised Face"</button>
                       <button onClick={() => setPrompt("Epic Explosion")} className="px-4 py-2 rounded-full bg-surface-light border border-white/5 hover:border-primary/50 hover:text-white text-text-secondary text-xs font-bold transition-all">Try "Epic Explosion"</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};

export default GeneratorPage;
