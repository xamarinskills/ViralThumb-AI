
import React, { useState } from 'react';

interface CheckoutPageProps {
  onNavigate: (page: any) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const [upiId, setUpiId] = useState("rohit.design@upi");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full -z-10" />
      
      <div className="w-full max-w-5xl bg-surface rounded-3xl shadow-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row">
        {/* Order Summary */}
        <div className="w-full md:w-2/5 bg-surface-light p-10 border-r border-white/5">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-text-secondary">shopping_cart</span>
            Order Summary
          </h3>
          
          <div className="p-4 rounded-2xl bg-surface border border-white/5 mb-8 flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-bold">Creator Pro Plan</p>
              <p className="text-xs text-text-secondary mt-1">AI Thumbnail Studio</p>
              <span className="mt-2 inline-block px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">Monthly</span>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-bold">₹422.88</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">GST (18%)</span>
              <span className="font-bold">₹76.12</span>
            </div>
            <div className="h-px bg-white/5 my-4"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Total Due</span>
              <span className="text-3xl font-black text-primary">₹499.00</span>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5 flex gap-4 text-text-secondary text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">lock</span> Secure</div>
            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">verified_user</span> Guarantee</div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex-1 p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Payment Details</h2>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Secure SSL
            </div>
          </div>
          
          <div className="flex gap-8 border-b border-white/5 mb-10 overflow-x-auto">
            <button className="pb-3 px-1 border-b-2 border-primary text-white font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">qr_code_scanner</span> UPI / QR
            </button>
            <button className="pb-3 px-1 border-b-2 border-transparent text-text-secondary hover:text-white font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">credit_card</span> Card
            </button>
            <button className="pb-3 px-1 border-b-2 border-transparent text-text-secondary hover:text-white font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">account_balance</span> Netbanking
            </button>
          </div>
          
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-4">Pay via preferred app</p>
              <div className="grid grid-cols-4 gap-4">
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <button key={app} className="p-4 rounded-xl border border-white/5 bg-surface-light hover:border-primary/50 flex flex-col items-center gap-2 transition-all">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-black">{app[0]}</div>
                    <span className="text-[10px] font-bold">{app}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-white/5"></div>
              <span className="mx-4 text-[10px] font-black text-text-secondary uppercase">OR ENTER UPI ID</span>
              <div className="flex-1 h-px bg-white/5"></div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold">UPI ID / VPA</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full h-14 pl-5 pr-28 bg-surface-light border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="username@bank"
                />
                <div className="absolute right-2 top-2 bottom-2 px-3 flex items-center gap-1.5 bg-green-500/10 rounded-lg text-green-500 text-[10px] font-black">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span> VERIFIED
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => onNavigate('success')}
              className="w-full h-16 bg-primary hover:bg-primary-hover text-white font-black text-xl rounded-2xl shadow-neon transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              Pay ₹499.00
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => onNavigate('pricing')}
        className="mt-8 text-sm font-bold text-text-secondary hover:text-white flex items-center gap-2 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Cancel and return to merchant
      </button>
    </div>
  );
};

export default CheckoutPage;
