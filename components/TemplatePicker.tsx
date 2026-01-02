import React, { useEffect, useState } from 'react';
import { getTemplates, TemplateRecord } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: string | null;
  onChange: (template: TemplateRecord) => void;
  className?: string;
}

const TemplateItem: React.FC<{
  template: TemplateRecord;
  isSelected: boolean;
  onClick: () => void;
}> = ({ template, isSelected, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      layout
      initial={false}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center w-full p-3 rounded-xl border transition-colors text-left group overflow-hidden ${
        isSelected
          ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(140,37,244,0.3)]'
          : 'bg-surface-light border-white/5 hover:border-white/10 hover:bg-white/5'
      }`}
    >
      {/* Active Glow Background */}
      {isSelected && (
        <motion.div
          layoutId="active-glow"
          className="absolute inset-0 bg-primary/5 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Image Container */}
      <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-black/40 border border-white/5 mr-3 z-10">
        {template.preview_url && !imgError ? (
          <>
            <img
              src={template.preview_url}
              alt={template.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setLoaded(true)}
              onError={() => setImgError(true)}
            />
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <span className="material-symbols-outlined text-white/20 text-lg">image</span>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col flex-1 min-w-0 pr-2 z-10">
        <span className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-white' : 'text-text-secondary group-hover:text-white'}`}>
          {template.name}
        </span>
        {template.description && (
          <span className={`text-[10px] mt-0.5 truncate transition-colors ${
            isSelected ? 'text-white/70' : 'text-text-secondary/60 group-hover:text-text-secondary'
          }`}>
            {template.description}
          </span>
        )}
      </div>

      {/* Checkmark */}
      <div className="relative w-5 h-5 flex items-center justify-center z-10">
        <AnimatePresence>
            {isSelected && (
                <motion.span 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="material-symbols-outlined text-sm text-primary"
                >
                check_circle
                </motion.span>
            )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

const TemplatePicker: React.FC<Props> = ({ value, onChange, className }) => {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      try {
        setLoading(true);
        const data = await getTemplates();
        
        if (mounted) {
          setTemplates(data);
          
          // Auto-select first template if none selected and data exists
          if (!value && data.length > 0) {
            onChange(data[0]);
          }
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to load templates");
          console.error(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={className}>
        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Style Template</label>
        <div className="grid grid-cols-1 gap-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-2 rounded-xl border border-white/5 bg-surface-light h-[60px]">
              <div className="w-12 h-12 rounded-lg bg-white/5 mr-3" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-white/5 rounded" />
                <div className="h-2 w-full bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Style Template</label>
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="block mt-2 underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Style Template</label>
      <div className="grid grid-cols-1 gap-2">
        {templates.map((t) => (
          <TemplateItem 
            key={t.id} 
            template={t} 
            isSelected={value === t.id} 
            onClick={() => onChange(t)} 
          />
        ))}
      </div>
    </div>
  );
};

export default TemplatePicker;
