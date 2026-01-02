import React, { useState } from 'react';
import YouTubeWatchPreview from './YouTubeWatchPreview';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  channelName: string;
  currentResults: string[];
  currentTitles: string[];
  currentDescriptions: string[];
  initialIndex: number | null;
}

const WatchPreviewModal: React.FC<Props> = ({
  open,
  onClose,
  channelName,
  currentResults,
  currentTitles,
  currentDescriptions,
  initialIndex,
}) => {
  if (!open) return null;

  const [selectedIndex, setSelectedIndex] = useState(initialIndex || 0);
  
  // Safe bounds check
  const index = Math.max(0, Math.min(selectedIndex, currentResults.length - 1));
  const url = currentResults[index];
  const title = currentTitles[index] || 'Untitled Video';
  const description = currentDescriptions[index] || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-6xl relative bg-[#0f0f0f] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="p-6">
          <YouTubeWatchPreview
            url={url}
            title={title}
            channel={channelName}
            subscribersText="1.2M subscribers"
            viewsText="450K views"
            uploadedText="2 hours ago"
            description={description}
            suggestions={currentResults.map((u, i) => ({
              url: u,
              title: currentTitles[i] || 'Watch Next',
              channel: channelName,
              views: 100000,
              uploadedText: 'New'
            }))}
            onSelectSuggestion={setSelectedIndex}
            onExit={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default WatchPreviewModal;
