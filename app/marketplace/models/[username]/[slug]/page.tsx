"use client";

import React, { useState, useEffect, use, Suspense } from 'react'; // Added 'use' and 'Suspense'
import { useRouter } from 'next/navigation'; // Removed 'useParams'
import { ethers } from 'ethers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  ShieldCheck, Zap, Coins, Users, ArrowUpRight, 
  Info, Check, ShoppingCart, TrendingUp, Percent,
  Globe, Box, Lock, Loader2, Copy, Wallet, CreditCard
} from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window { ethereum?: any; }
}

// 1. Define Props type with a Promise for params
type PageProps = {
  params: Promise<{ username: string; slug: string }>;
};

// 2. THE WRAPPER (Default Export)
// This handles the Suspense boundary required for Vercel builds
export default function MarketplaceModelDetail({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-zinc-400 animate-pulse">Establishing Secure Connection...</div>}>
      <MarketplaceContent params={params} />
    </Suspense>
  );
}

// 3. THE CONTENT COMPONENT (Your actual logic)
function MarketplaceContent({ params }: PageProps) {
  // 4. Unwrap the asynchronous params using 'use'
  const resolvedParams = use(params);
  const username = resolvedParams.username;
  const slug = resolvedParams.slug;

  const router = useRouter();
  const supabase = createClient();

  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // Interaction States
  const [shareAmount, setShareAmount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    async function init() {
      // 1. Fetch Model Data
      const { data: allModels } = await supabase.from('models').select('*');
      const target = allModels?.find((m: any) => {
        return m.info.author.toLowerCase() === username.toLowerCase() &&
               m.info.name.toLowerCase().replace(/\s+/g, '-') === slug;
      });

      // 2. Fetch Current User Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (profile) setCurrentUser(profile.username);
      }

      if (target) setModel(target);
      setLoading(false);
    }
    init();
  }, [username, slug, supabase]);

  if (loading) return <div className="h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-zinc-400 animate-pulse">Establishing Secure Connection...</div>;
  if (!model) return <div className="h-screen flex items-center justify-center font-bold">Registry Error: Node not found in marketplace.</div>;

  const { info } = model;
  const currentOwners = info.owners || [{ username: info.author, share: 100 }];
  
  const isOwner = currentOwners.some((o: any) => o.username === currentUser);
  const valuation = (info.price_eth * 200).toFixed(2);
  const shareCost = ((parseFloat(valuation) / 100) * shareAmount).toFixed(4);
  const buyoutPrice = info.acquisition_price_eth || 5.0;

  const handleBuyout = async () => {
    if (!currentUser) return alert("Please log in to purchase.");
    if (isOwner) return alert("You already own this model registry.");

    setIsProcessing(true);
    setStatusMsg("Connecting to MetaMask...");

    try {
      if (!window.ethereum) throw new Error("MetaMask not found.");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setStatusMsg(`Waiting for ${buyoutPrice} ETH transaction...`);

      const tx = await signer.sendTransaction({
        to: "0xd8dF6A5913DFFbDc5FB06A3E5C6b0C094266EC4C", 
        value: ethers.parseEther(buyoutPrice.toString())
      });

      setStatusMsg("Confirming on-chain...");
      await tx.wait();

      setStatusMsg("Transferring ownership in registry...");

      const updatedInfo = {
        ...info,
        author: currentUser,
        owners: [{ username: currentUser, share: 100 }],
        ownership_type: 'single'
      };

      const { error } = await supabase
        .from('models')
        .update({ info: updatedInfo })
        .eq('id', model.id);

      if (error) throw error;

      setStatusMsg("Registry Updated! Redirecting...");
      setTimeout(() => router.push('/dashboard/models'), 1500);

    } catch (e: any) {
      console.error(e);
      alert(e.message || "Transaction failed.");
      setStatusMsg("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased pb-32">
      {/* STATS MARQUEE */}
      <div className="border-b border-zinc-100 bg-zinc-50 py-2">
         <div className="mx-auto max-w-7xl px-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <div className="flex items-center gap-6">
               <span className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-green-500" /> Registry Live</span>
               <span>Liquidity Index: {info.price_eth} ETH/REQ</span>
            </div>
            <span className="flex items-center gap-1 font-mono">{info.ipfs_cid.substring(0, 20)}...</span>
         </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-12">
             <header className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-lg font-mono">
                      <span className="text-white font-black text-lg uppercase">{info.name.charAt(0)}</span>
                   </div>
                   <h1 className="text-4xl font-bold tracking-tighter">
                      <span className="text-zinc-300 font-normal">{username}</span> / {info.name}
                   </h1>
                </div>
                <p className="text-lg text-zinc-500 leading-relaxed max-w-2xl">{info.description}</p>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-zinc-100 rounded-md text-[10px] font-black uppercase tracking-widest">{info.task}</div>
                   <div className="px-3 py-1 bg-zinc-100 rounded-md text-[10px] font-black uppercase tracking-widest">{info.framework}</div>
                </div>
             </header>

             <section className="space-y-4 pt-12 border-t border-zinc-50">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                   <Info size={14}/> Technical Manifest
                </h3>
                <div className="prose prose-zinc prose-sm max-w-none prose-headings:tracking-tighter prose-headings:font-bold">
                   <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {info.readme || "No documentation available."}
                   </ReactMarkdown>
                </div>
             </section>
          </div>

          <div className="lg:col-span-5 space-y-8">
             <div className="rounded-3xl border-2 border-black p-8 bg-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet size={120} /></div>
                
                <div className="space-y-1 mb-6">
                   <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-yellow-400 text-black rounded text-[10px] font-black uppercase tracking-widest mb-2">Buyout Model</div>
                   <h2 className="text-xl font-black uppercase tracking-widest text-black">Acquire Ownership</h2>
                   <p className="text-xs text-zinc-500 leading-relaxed">Instantly transfer 100% of registry rights and future revenue to your handle.</p>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-end justify-between mb-6">
                   <div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Buyout Price</p>
                      <p className="text-3xl font-black font-mono mt-1">{buyoutPrice} <span className="text-sm font-bold text-zinc-400">ETH</span></p>
                   </div>
                   <CreditCard className="text-zinc-200" size={32} />
                </div>

                <button 
                  onClick={handleBuyout}
                  disabled={isProcessing || isOwner}
                  className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${isOwner ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-black text-white hover:bg-zinc-800 shadow-black/20 active:scale-95'}`}
                >
                   {isProcessing ? <><Loader2 className="animate-spin" size={18}/> {statusMsg}</> : isOwner ? "You Own This" : <><ShoppingCart size={18}/> Execute Buyout</>}
                </button>
             </div>

             <div className="rounded-3xl border border-zinc-200 p-8 bg-zinc-50/50 space-y-6">
                <div>
                   <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">Fractional Equity</h2>
                   <p className="text-xs text-zinc-400 mt-1">Buy percentage shares of revenue.</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</span>
                         <span className="text-2xl font-black font-mono">{shareAmount}%</span>
                      </div>
                      <input 
                         type="range" min="1" max="10" step="1" value={shareAmount}
                         onChange={(e) => setShareAmount(parseInt(e.target.value))}
                         className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                   </div>

                   <button className="w-full py-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
                      Request {shareCost} ETH Purchase
                   </button>
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                   <Users size={12}/> Current Cap Table
                </h3>
                <div className="divide-y divide-zinc-50 border border-zinc-100 rounded-2xl bg-white overflow-hidden shadow-sm">
                   {currentOwners.map((owner: any) => (
                      <div key={owner.username} className="flex items-center justify-between p-4 bg-white">
                         <div className="flex items-center gap-3">
                            <div className={`h-6 w-6 rounded flex items-center justify-center text-[10px] font-black uppercase ${owner.username === username ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>{owner.username.charAt(0)}</div>
                            <span className="text-sm font-bold">@{owner.username}</span>
                         </div>
                         <span className="text-xs font-mono font-bold text-zinc-400">{owner.share}%</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}