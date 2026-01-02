
import React, { useState, useEffect } from 'react';
import { getUserGenerations } from '../services/supabase';

interface Generation {
    id: string;
    user_id: string;
    prompt: string;
    output_url: string;
    credits_used: number;
    created_at: string;
    title?: string;
    description?: string;
}

interface GenerationHistoryProps {
    userId: string;
    refreshTrigger?: number;
}

const PAGE_SIZE = 20;

const GenerationHistory: React.FC<GenerationHistoryProps> = ({ userId, refreshTrigger = 0 }) => {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPage(0);
        setGenerations([]);
        setHasMore(true);
        loadGenerations(0, true);
    }, [userId, refreshTrigger]);

    const loadGenerations = async (pageIndex: number, isInitial: boolean = false) => {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            const offset = pageIndex * PAGE_SIZE;
            const data = await getUserGenerations(userId, PAGE_SIZE, offset);
            
            if (data.length < PAGE_SIZE) {
                setHasMore(false);
            }

            if (isInitial) {
                setGenerations(data);
            } else {
                setGenerations(prev => [...prev, ...data]);
            }
        } catch (error) {
            console.error('Failed to load generation history:', error);
            setError('Failed to load history. Please try again.');
        } finally {
            if (isInitial) setLoading(false);
            else setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadGenerations(nextPage);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Generation History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-video rounded-xl bg-surface-light animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
         return (
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Generation History</h3>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                    <button onClick={() => loadGenerations(0, true)} className="ml-2 underline">Retry</button>
                </div>
            </div>
        );
    }

    if (generations.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Generation History</h3>
                <div className="glass p-12 rounded-3xl border border-white/10 text-center">
                    <span className="material-symbols-outlined text-6xl text-text-secondary/30 mb-4 block">image</span>
                    <h4 className="text-lg font-bold mb-2">No Generations Yet</h4>
                    <p className="text-sm text-text-secondary">Your generated images will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">
                        Generation History ({generations.length}{hasMore ? '+' : ''})
                    </h3>
                    <button
                        onClick={() => loadGenerations(0, true)}
                        className="text-[10px] font-black text-primary hover:underline uppercase"
                    >
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generations.map((gen) => (
                        <div
                            key={gen.id}
                            className="group flex flex-col rounded-xl overflow-hidden border border-white/10 bg-surface hover:border-primary/50 transition-all"
                        >
                            <div 
                                className="relative aspect-video overflow-hidden cursor-pointer"
                                onClick={() => setSelectedImage(gen.output_url)}
                            >
                                <img
                                    src={gen.output_url}
                                    alt={gen.title || gen.prompt}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-3xl">visibility</span>
                                </div>
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col">
                                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">AI Generated</p>
                                <h3 className="font-bold text-sm truncate" title={gen.title || gen.prompt}>
                                    {gen.title ? `"${gen.title}"` : gen.prompt}
                                </h3>
                                {gen.description && (
                                    <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                                        {gen.description}
                                    </p>
                                )}
                                <div className="mt-auto pt-3 flex items-center justify-between">
                                    <p className="text-[10px] text-text-secondary">
                                        {formatDate(gen.created_at)}
                                    </p>
                                    <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                                        <span className="material-symbols-outlined text-xs">bolt</span>
                                        {gen.credits_used}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {hasMore && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-6 py-2 rounded-xl bg-surface-light border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>

            {/* Full-size Image Modal */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size"
                        className="max-w-full max-h-full rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export default GenerationHistory;
