"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Shield, 
  Key, 
  CreditCard, 
  Trash2, 
  Copy, 
  Zap,
  Check,
  RefreshCcw,
  Loader2,
  Camera,
  AtSign,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from "@/lib/supabase/client";

export default function StandaloneSettings() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // API Key State
  const [apiKey, setApiKey] = useState("pk_live_8291x_vhm_wsf8_z9a1l_m3");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (data) setUsername(data.username);
      }
      setLoading(false);
    }
    getProfile();
  }, [supabase]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    // Simulating DB sync
    setTimeout(() => {
      setIsUpdating(false);
    }, 1000);
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <Loader2 className="animate-spin text-zinc-300" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-black selection:text-white pb-32">
      
      {/* 1. Header Navigation */}
      <div className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
           <Link href="/dashboard/overview" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors">
              <ChevronLeft size={16} />
              Back to Dashboard
           </Link>
           <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-black rounded flex items-center justify-center">
                 <span className="text-white text-[10px] font-black">HF</span>
              </div>
              <span className="text-sm font-black tracking-tighter uppercase italic">Platform AI</span>
           </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-16">
        
        {/* 2. Page Title */}
        <header className="mb-12">
           <h1 className="text-4xl font-black tracking-tighter uppercase italic">Account Settings</h1>
           <p className="text-gray-400 mt-2 font-medium">Configure your platform identity, security, and usage.</p>
        </header>

        {/* 3. Horizontal Navigation Tabs */}
        <nav className="flex gap-8 border-b border-gray-100 mb-12">
           <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile" icon={<User size={16}/>} />
           <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')} label="API Tokens" icon={<Key size={16}/>} />
           <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} label="Billing" icon={<CreditCard size={16}/>} />
        </nav>

        {/* 4. Content Sections */}
        <div className="space-y-16">
          
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-12">
               {/* Avatar Row */}
               <section className="flex flex-col md:flex-row md:items-center gap-8 pb-12 border-b border-gray-50">
                  <div className="relative group shrink-0">
                    <div className="h-24 w-24 rounded-full bg-zinc-950 flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 border-white overflow-hidden">
                       {avatarPreview ? <img src={avatarPreview} className="h-full w-full object-cover" /> : username?.charAt(0).toUpperCase()}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                       <Camera size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Profile Identity</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">This information will be displayed on your model registry and public profile card.</p>
                    <button className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:opacity-70 transition-opacity">Change Avatar Image</button>
                  </div>
               </section>

               {/* Username Input */}
               <section className="space-y-4">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Username Handle</label>
                  <div className="flex gap-4">
                     <div className="relative flex-1 group">
                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={18} />
                        <input 
                          value={username} onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold focus:border-black focus:bg-white outline-none transition-all"
                        />
                     </div>
                     <button 
                       onClick={handleUpdate}
                       disabled={isUpdating}
                       className="px-8 py-3 bg-black text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-30 transition-all flex items-center gap-2"
                     >
                       {isUpdating ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                     </button>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">Note: Your unique URL will update to platform.ai/<span className="text-black">{username || "handle"}</span></p>
               </section>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="animate-in fade-in duration-500 space-y-8">
               <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-gray-50 bg-zinc-50/30 flex items-center justify-between">
                     <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Master API Key</h3>
                        <p className="text-xs text-gray-500 mt-1">Used to authenticate your backend inference requests.</p>
                     </div>
                     <button className="p-2 border border-gray-200 rounded-lg hover:bg-white transition-colors shadow-sm"><RefreshCcw size={16} className="text-gray-400"/></button>
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="flex items-center gap-4 p-4 bg-zinc-950 rounded-2xl shadow-inner group">
                        <code className="flex-1 font-mono text-sm text-zinc-400 truncate tracking-tight">
                           {showKey ? apiKey : "pk_live_" + "•".repeat(24)}
                        </code>
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="text-[10px] font-black text-white uppercase tracking-widest px-3 py-1.5 border border-zinc-800 rounded-lg hover:bg-zinc-900 transition-colors"
                        >
                           {showKey ? "Hide" : "Reveal"}
                        </button>
                        <button className="text-zinc-500 hover:text-white transition-colors p-1"><Copy size={18}/></button>
                     </div>
                     <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/50 flex gap-3">
                        <Zap size={18} className="text-orange-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-orange-800 font-bold leading-relaxed">
                           SECURITY ALERT: This key provides full access to your account balances. Store it securely and never expose it in client-side code.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="animate-in fade-in duration-500 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 rounded-2xl border-2 border-black bg-white shadow-2xl shadow-black/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Check size={24} className="text-green-600" strokeWidth={4} /></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current active tier</p>
                     <h3 className="text-2xl font-bold mt-2">Researcher Pro</h3>
                     <p className="text-4xl font-black font-mono mt-6 tracking-tighter">0.05 <span className="text-sm font-medium text-gray-400 tracking-normal">ETH / MO</span></p>
                     <button className="mt-8 w-full py-3 bg-zinc-100 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-zinc-400 cursor-not-allowed">Plan Managed</button>
                  </div>

                  <div className="p-8 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Utilization</p>
                        <h3 className="text-xl font-bold mt-1">Inference Budget</h3>
                        <div className="mt-8 space-y-3">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black uppercase text-zinc-400">82,401 / 100k Tokens</span>
                              <span className="text-sm font-mono font-bold">82%</span>
                           </div>
                           <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-black w-[82%] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]" />
                           </div>
                        </div>
                     </div>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">Resets in 12 days</p>
                  </div>
               </div>
            </div>
          )}

          {/* 5. Danger Zone - Persistent */}
          <section className="pt-20 border-t border-gray-100">
             <div className="rounded-3xl border border-red-100 bg-red-50/20 overflow-hidden shadow-xl shadow-red-500/5">
                <div className="p-8 bg-white border-b border-red-50 flex items-center justify-between">
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-600">Administrative Danger Zone</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">Warning: These operations are final and result in total data loss.</p>
                   </div>
                   <AlertTriangle className="text-red-100" size={32} strokeWidth={3} />
                </div>
                <div className="p-8 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div>
                      <p className="text-sm font-bold text-black flex items-center gap-2"><Trash2 size={16}/> Delete Account Profile</p>
                      <p className="text-xs text-gray-500 mt-1">This will permanently destroy your registry, model weights, and inference keys.</p>
                   </div>
                   <button className="px-8 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95">Deactivate Profile</button>
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}

/* --- REFINED UI HELPERS --- */

const TabButton = ({ active, label, icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2.5 pb-4 px-1 text-sm font-bold uppercase tracking-widest transition-all border-b-2 -mb-[2px] ${
      active ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black hover:border-gray-100'
    }`}
  >
    {icon}
    {label}
  </button>
);