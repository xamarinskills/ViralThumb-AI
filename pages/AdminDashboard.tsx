
import React, { useState } from 'react';

interface AdminDashboardProps {
  onNavigate: (page: any) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('All');

  const activityData = [
    {
      id: 1,
      user: { name: 'John Smith', email: 'john@example.com', avatar: 'https://i.pravatar.cc/150?u=john' },
      type: 'Thumbnail Gen',
      icon: 'auto_awesome',
      details: '"Minecraft survival ep 1 with fire..."',
      context: 'Template: Gaming Vivid V2',
      plan: 'Pro',
      status: 'Completed',
      time: '2 mins ago'
    },
    {
      id: 2,
      user: { name: 'Ada Lovelace', email: 'ada@tech.io', avatar: 'https://i.pravatar.cc/150?u=ada' },
      type: 'Subscription',
      icon: 'payments',
      details: 'Upgraded to Enterprise',
      context: 'Inv #49201',
      plan: 'Enterprise',
      status: 'Paid',
      time: '15 mins ago'
    },
    {
      id: 3,
      user: { name: 'Sarah Connor', email: 'sarah@future.net', avatar: 'https://i.pravatar.cc/150?u=sarah' },
      type: 'Template Used',
      icon: 'style',
      details: 'Crypto Bull Run 2024',
      context: 'Category: Finance',
      plan: 'Free',
      status: 'Saved',
      time: '42 mins ago'
    },
    {
      id: 4,
      user: { name: 'Mike Ross', email: 'mike@legal.com', avatar: 'https://i.pravatar.cc/150?u=mike' },
      type: 'Payment Failed',
      icon: 'error',
      details: 'Card declined',
      context: 'Retry count: 2',
      plan: 'Pro',
      status: 'Failed',
      time: '1 hour ago'
    },
    {
      id: 5,
      user: { name: 'David Miller', email: 'david@vlog.com', avatar: 'https://i.pravatar.cc/150?u=david' },
      type: 'User Login',
      icon: 'login',
      details: 'New device detected',
      context: 'IP: 192.168.1.1',
      plan: 'Free',
      status: 'Verified',
      time: '2 hours ago'
    }
  ];

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#0a0a0c] flex flex-col">
        <div className="p-8 flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-neon">
            <span className="material-symbols-outlined text-white">auto_awesome</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">ThumbnailAI</h1>
            <span className="text-[10px] uppercase font-black text-primary tracking-widest opacity-80">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <p className="px-4 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-4">Overview</p>
            <NavItem icon="dashboard" label="Activity Dashboard" active />
          </div>

          <div>
            <p className="px-4 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-4">Users & Content</p>
            <NavItem icon="group" label="User Management" />
            <NavItem icon="grid_view" label="Templates" />
          </div>

          <div>
            <p className="px-4 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-4">Financials</p>
            <NavItem icon="receipt_long" label="Transactions" />
            <NavItem icon="loyalty" label="Subscriptions" />
          </div>

          <div>
            <p className="px-4 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-4">System</p>
            <NavItem icon="settings" label="Settings" />
            <NavItem icon="terminal" label="Server Logs" />
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 bg-surface/30">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?u=admin" className="w-10 h-10 rounded-xl border border-white/10" alt="Admin" />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate">Admin User</p>
              <p className="text-[10px] text-text-secondary truncate">superadmin@thumbnail.ai</p>
            </div>
            <button className="text-text-secondary hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black">Activity Overview</h2>
            <p className="text-xs text-text-secondary">Real-time monitoring of user actions and system events.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search logs, users, or IDs..." 
                className="w-full h-12 pl-12 pr-4 bg-surface border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-text-secondary/50"
              />
            </div>
            <button className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-surface border border-white/5 hover:bg-white/5 transition-colors group">
              <span className="material-symbols-outlined text-text-secondary group-hover:text-white transition-colors">notifications</span>
              <span className="absolute top-3 right-3 w-2 h-2 bg-pink-500 rounded-full border-2 border-background"></span>
            </button>
            <button className="h-12 px-6 bg-gradient-to-r from-primary to-indigo-600 hover:scale-105 active:scale-95 transition-all rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-neon">
              <span className="material-symbols-outlined text-sm">download</span>
              Export Report
            </button>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD AREA */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
          {/* METRICS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Total Generations" 
              value="24,592" 
              trend="+12%" 
              trendUp={true} 
              subtext="Past 30 days" 
              icon="bolt" 
              color="primary"
            />
            <StatCard 
              label="Active Users" 
              value="1,840" 
              trend="+5.4%" 
              trendUp={true} 
              subtext="Currently online: 142" 
              icon="person_add" 
              color="cyan"
            />
            <StatCard 
              label="Monthly Revenue" 
              value="$42,300" 
              trend="-1.2%" 
              trendUp={false} 
              subtext="vs last month" 
              icon="account_balance_wallet" 
              color="pink"
            />
            <StatCard 
              label="Avg. Gen Time" 
              value="4.2s" 
              status="Fast" 
              subtext="GPU Load: 65%" 
              icon="timer" 
              color="orange"
            />
          </div>

          {/* ACTIVITY FILTER BAR */}
          <div className="flex items-center justify-between">
            <div className="flex bg-surface border border-white/5 rounded-xl p-1.5 gap-1">
              {['All', 'Generations', 'Payments', 'Templates'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`h-10 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-12 px-5 bg-surface border border-white/5 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-text-secondary text-[20px]">calendar_today</span>
                <span className="text-xs font-bold">Last 24 Hours</span>
                <span className="material-symbols-outlined text-text-secondary text-[16px]">expand_more</span>
              </div>
              <button className="h-12 w-12 flex items-center justify-center bg-surface border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-text-secondary">filter_list</span>
              </button>
            </div>
          </div>

          {/* ACTIVITY TABLE */}
          <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">User</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Activity Type</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Details / Context</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Plan</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activityData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <img src={row.user.avatar} className="w-9 h-9 rounded-xl border border-white/10 group-hover:scale-110 transition-transform" alt={row.user.name} />
                        <div>
                          <p className="text-sm font-bold">{row.user.name}</p>
                          <p className="text-[10px] text-text-secondary">{row.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">{row.icon}</span>
                        <span className="text-xs font-bold">{row.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-xs font-medium text-white/90 truncate max-w-[200px]">{row.details}</p>
                        <p className="text-[10px] text-text-secondary">{row.context}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        row.plan === 'Pro' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 
                        row.plan === 'Enterprise' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                        'bg-white/5 border-white/10 text-text-secondary'
                      }`}>
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-8 py-5 text-xs text-text-secondary font-medium">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-black/10">
              <p className="text-xs text-text-secondary">Showing <span className="text-white font-bold">1 to 5</span> of <span className="text-white font-bold">1,248</span> results</p>
              <div className="flex gap-2">
                <button className="h-9 px-4 rounded-lg bg-surface border border-white/5 text-xs font-bold hover:bg-white/5 transition-all opacity-50 cursor-not-allowed">Previous</button>
                <button className="h-9 px-4 rounded-lg bg-surface border border-white/5 text-xs font-bold hover:bg-white/5 transition-all">Next</button>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION - SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Performing Templates */}
            <div className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  Top Performing Templates
                </h3>
                <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline transition-all">View All</button>
              </div>

              <div className="space-y-6">
                <TemplateListItem 
                  image="https://picsum.photos/seed/game/800/450" 
                  title="Minecraft Survival Shock" 
                  category="Gaming • 1.2k uses" 
                  badge="High CTR" 
                  badgeColor="bg-green-500/10 text-green-400 border-green-500/30"
                  score={92}
                />
                <TemplateListItem 
                  image="https://picsum.photos/seed/finance/800/450" 
                  title="Finance Chart Green Up" 
                  category="Business • 980 uses" 
                  badge="Trending" 
                  badgeColor="bg-primary/10 text-primary border-primary/30"
                  score={85}
                />
                <TemplateListItem 
                  image="https://picsum.photos/seed/react/800/450" 
                  title="Master React in 10 Mins" 
                  category="Tutorial • 840 uses" 
                  score={78}
                />
              </div>
            </div>

            {/* System Status */}
            <div className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl">
              <h3 className="text-lg font-black mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                System Status
              </h3>

              <div className="space-y-6">
                <StatusRow label="API Uptime" value="99.98%" status="Success" />
                <StatusRow label="GPU Queue" value="Moderate" status="Warning" />
                <StatusRow label="Payment Gateway" value="Operational" status="Success" />
                <StatusRow label="Cloud Storage" value="Low Latency" status="Success" />
                <StatusRow label="CDN Propogation" value="Healthy" status="Success" />
              </div>

              <div className="mt-10 p-5 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary mt-1">info</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Upcoming Maintenance</p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">System upgrade scheduled for Sunday, Oct 27 at 03:00 AM IST. Expect ~5 mins downtime.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) => (
  <div className={`h-12 px-4 flex items-center gap-4 cursor-pointer transition-all duration-300 rounded-xl mx-2 group ${active ? 'bg-primary/10 border border-primary/20 text-primary shadow-sm' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>
    <span className={`material-symbols-outlined text-[20px] transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="text-sm font-bold tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-neon"></div>}
  </div>
);

const StatCard = ({ label, value, trend, trendUp, subtext, status, icon, color }: any) => {
  const colorMap: any = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  };

  return (
    <div className="p-7 bg-surface border border-white/5 rounded-2xl shadow-lg relative group hover:-translate-y-1 hover:shadow-neon/20 transition-all duration-300">
      <div className={`absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${colorMap[color]} group-hover:scale-110`}>
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </div>
      
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-3">{label}</p>
      <div className="flex items-baseline gap-3 mb-2">
        <h4 className="text-3xl font-black">{value}</h4>
        {trend && (
          <span className={`text-xs font-black flex items-center ${trendUp ? 'text-green-400' : 'text-pink-400'}`}>
            <span className="material-symbols-outlined text-[16px]">{trendUp ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
            {trend}
          </span>
        )}
        {status && (
          <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            {status}
          </span>
        )}
      </div>
      <p className="text-[11px] font-medium text-text-secondary opacity-70">{subtext}</p>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    Completed: 'bg-green-500/10 text-green-400 border-green-500/30',
    Paid: 'bg-green-500/10 text-green-400 border-green-500/30',
    Saved: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    Failed: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    Verified: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    Warning: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[status] || colors.Warning}`}>
      {status}
    </span>
  );
};

const TemplateListItem = ({ image, title, category, badge, badgeColor, score }: any) => (
  <div className="flex items-center gap-5 group cursor-pointer">
    <div className="w-20 aspect-video rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
      <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={title} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1 gap-4">
        <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{title}</h4>
        {badge && (
          <span className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] text-text-secondary font-medium">{category}</p>
    </div>
    <div className="text-right">
       <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">CTR Score</p>
       <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-primary to-indigo-400" style={{ width: `${score}%` }}></div>
       </div>
    </div>
  </div>
);

const StatusRow = ({ label, value, status }: { label: string, value: string, status: 'Success' | 'Warning' | 'Error' }) => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${status === 'Success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : status === 'Warning' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]'}`}></div>
      <span className="text-xs font-bold text-text-secondary">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs font-black uppercase tracking-wider">{value}</span>
      {status === 'Success' && <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>}
      {status === 'Warning' && <span className="material-symbols-outlined text-orange-500 text-[18px]">warning</span>}
    </div>
  </div>
);

export default AdminDashboard;
