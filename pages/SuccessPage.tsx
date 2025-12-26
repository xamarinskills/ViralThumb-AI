
import React from 'react';

interface SuccessPageProps {
  onNavigate: (page: any) => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      
      <div className="w-full max-w-lg p-12 rounded-3xl glass border border-white/5 shadow-neon">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-2 ring-primary/20 mx-auto mb-10 animate-bounce">
          <span className="material-symbols-outlined text-[56px] font-black">check_circle</span>
        </div>
        
        <h1 className="text-4xl font-black mb-4">Payment Successful!</h1>
        <p className="text-text-secondary text-lg mb-10 leading-relaxed">
          You are now subscribed to the <span className="text-white font-bold">Creator Pro Plan</span>. Your AI engine is fueled up and ready to generate viral thumbnails.
        </p>
        
        <div className="bg-background/50 rounded-2xl p-6 border border-white/5 mb-10 text-left space-y-4">
          <div className="flex justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Amount Paid</span>
            <span className="text-sm font-bold text-white">₹499.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Transaction ID</span>
            <span className="text-sm font-bold text-white font-mono">#VT-AI-99283-X</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Date</span>
            <span className="text-sm font-bold text-white">October 24, 2024</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => onNavigate('generator')}
            className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black rounded-2xl shadow-neon transition-all flex items-center justify-center gap-2"
          >
            Start Creating Thumbnails
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          
          <div className="flex items-center justify-center gap-6 pt-4">
            <button className="text-xs font-bold text-text-secondary hover:text-white flex items-center gap-1.5 transition-colors">
              <span className="material-symbols-outlined text-[16px]">download</span> Download Invoice
            </button>
            <div className="w-px h-3 bg-white/10"></div>
            <button onClick={() => onNavigate('dashboard')} className="text-xs font-bold text-text-secondary hover:text-white transition-colors">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-text-secondary flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        Secure 256-bit SSL Encrypted Payment
      </p>
    </div>
  );
};

export default SuccessPage;
