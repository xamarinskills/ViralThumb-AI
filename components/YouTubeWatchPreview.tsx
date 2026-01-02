import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Suggestion {
  url: string;
  title: string;
  channel: string;
  views: number;
  uploadedText: string;
}

interface Props {
  url: string;
  title: string;
  channel: string;
  subscribersText: string;
  viewsText: string;
  uploadedText: string;
  description: string;
  suggestions: Suggestion[];
  onSelectSuggestion: (index: number) => void;
  onExit?: () => void;
}

const YouTubeWatchPreview: React.FC<Props> = ({
  url,
  title,
  channel,
  subscribersText,
  viewsText,
  uploadedText,
  description,
  suggestions,
  onSelectSuggestion,
  onExit
}) => {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const total = 900;
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setCurrent((c) => Math.min(total, c + 1));
      }, 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing]);

  const progress = useMemo(() => (total ? Math.round((current / total) * 100) : 0), [current, total]);
  const currentText = useMemo(() => {
    const m = Math.floor(current / 60);
    const s = String(current % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [current]);
  const totalText = useMemo(() => {
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [total]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-0" aria-label="YouTube Preview">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="relative aspect-video bg-black">
            <img src={url} className="absolute inset-0 w-full h-full object-contain" />
            <button
              onClick={() => setPlaying((p) => !p)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center hover:bg-white/20"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              <span className="material-symbols-outlined">{playing ? 'pause' : 'play_arrow'}</span>
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center gap-3 text-white">
                <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                  <span className="material-symbols-outlined">{playing ? 'pause' : 'play_arrow'}</span>
                </button>
                <div className="flex-1">
                  <div className="h-1 bg-white/20 rounded-full">
                    <div className="h-1 bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={total}
                    value={current}
                    onChange={(e) => setCurrent(Number(e.target.value))}
                    className="w-full opacity-0"
                    aria-label="Seek"
                  />
                </div>
                <div className="text-xs">{currentText} / {totalText}</div>
                <button aria-label="Volume">
                  <span className="material-symbols-outlined">volume_up</span>
                </button>
                <button aria-label="Settings">
                  <span className="material-symbols-outlined">settings</span>
                </button>
                <button aria-label="Mini player">
                  <span className="material-symbols-outlined">picture_in_picture_alt</span>
                </button>
                <button aria-label="Theater mode">
                  <span className="material-symbols-outlined">crop_16_9</span>
                </button>
                <button aria-label="Fullscreen">
                  <span className="material-symbols-outlined">fullscreen</span>
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold leading-tight line-clamp-2">{title}</h1>
          </div>
          <div className="mt-3 text-sm text-text-secondary">{viewsText} • {uploadedText}</div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-xs">{channel[0]?.toUpperCase()}</div>
              <div>
                <div className="text-sm font-bold">{channel}</div>
                <div className="text-xs text-text-secondary">{subscribersText}</div>
              </div>
              <button className="ml-4 h-9 px-4 rounded-full bg-white text-black text-xs font-black">Subscribe</button>
            </div>
            <div className="flex items-center gap-3 text-white">
              <button className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold" aria-label="Like">👍</button>
              <button className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold" aria-label="Dislike">👎</button>
              <button className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold" aria-label="Share">Share</button>
              <button className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold" aria-label="Download">Download</button>
              <button className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold" aria-label="Clip">Clip</button>
              <button className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold" aria-label="Save">Save</button>
            </div>
          </div>
          <div className="mt-4 text-sm text-text-secondary">
            <div className="line-clamp-3 whitespace-pre-line">{description}</div>
            <button className="mt-2 text-blue-400 text-xs font-bold">Show more</button>
          </div>
          {onExit && (
            <div className="mt-6">
              <button onClick={onExit} className="h-9 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-[11px] font-black uppercase tracking-widest">Back</button>
            </div>
          )}
        </div>
        <aside className="lg:col-span-1">
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <button
                key={`${s.url}-${i}`}
                onClick={() => onSelectSuggestion(i)}
                className="w-full text-left flex gap-3 hover:bg-white/5 rounded-md p-1"
                aria-label={`Open ${s.title}`}
              >
                <div className="w-40 aspect-video bg-black">
                  <img src={s.url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold line-clamp-2">{s.title}</div>
                  <div className="text-xs text-text-secondary">{s.channel}</div>
                  <div className="text-xs text-text-secondary">{s.views.toLocaleString()} views • {s.uploadedText}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default YouTubeWatchPreview;

