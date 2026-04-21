"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { 
  Upload, FileCode, X, ShieldCheck, Zap, Loader2, 
  ChevronDown, LayoutGrid, BookOpen, MessageSquare, Image as ImageIcon, Type,
  User, Users, Search, UserPlus, AlertCircle, Percent, Coins, DollarSign
} from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { secureUpload } from "@/lib/upload-service";

declare global {
  interface Window { ethereum?: any; }
}

const CONTRACT_ABI = [
  "function modelCount() view returns (uint256)",
  "function registerModel(string _ipfsCid, uint256 _price, uint256 _subscriptionPrice) returns (uint256)"
];
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const MODEL_TASKS = [
  { id: "text-to-text", label: "Text-to-Text", icon: <MessageSquare size={16}/>, desc: "LLMs, Chatbots, Translation" },
  { id: "text-to-image", label: "Text-to-Image", icon: <ImageIcon size={16}/>, desc: "Stable Diffusion, Flux, Art" },
  { id: "image-to-text", label: "Image-to-Text", icon: <Type size={16}/>, desc: "Captioning, OCR, Analysis" },
];

interface Collaborator {
  username: string;
  share: number;
}

export default function CreateModelPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Ownership State
  const [ownershipType, setOwnershipType] = useState<'single' | 'multi'>('single');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form States
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [readme, setReadme] = useState("");
  const [task, setTask] = useState("");
  const [framework, setFramework] = useState("onnx");
  const [price, setPrice] = useState("");
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [acquisitionPrice, setAcquisitionPrice] = useState(""); // New: Buyout Price
  
  // UI Status
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (data) {
          setUsername(data.username);
          setCollaborators([{ username: data.username, share: 100 }]);
        }
      }
      setLoadingUser(false);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const search = async () => {
      if (userSearch.length < 2) return setSearchResults([]);
      setIsSearching(true);
      const { data } = await supabase.from('profiles').select('username').ilike('username', `%${userSearch}%`).neq('username', username).limit(5);
      setSearchResults(data || []);
      setIsSearching(false);
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [userSearch, username]);

  const addCollaborator = (handle: string) => {
    if (collaborators.length >= 5) return alert("Max 5 owners allowed.");
    if (!collaborators.find(c => c.username === handle)) {
      setCollaborators([...collaborators, { username: handle, share: 0 }]);
      setUserSearch("");
      setSearchResults([]);
    }
  };

  const updateShare = (index: number, val: number) => {
    const updated = [...collaborators];
    updated[index].share = val;
    setCollaborators(updated);
  };

  const totalShare = collaborators.reduce((acc, curr) => acc + curr.share, 0);

  const connectWallet = async (): Promise<{ provider: ethers.BrowserProvider; signer: ethers.Signer }> => {
    if (!window.ethereum) throw new Error("MetaMask not found.");
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    return { provider, signer: await provider.getSigner() };
  };

  const handleSubmit = async () => {
    if (!file || !name || !price || !subscriptionPrice || !task || !acquisitionPrice) {
      return alert("Fill all fields including Acquisition Price.");
    }
    if (ownershipType === 'multi' && totalShare !== 100) return alert("Total split must be 100%");

    setIsDeploying(true);
    try {
      const { signer } = await connectWallet();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const currentCount = await contract.modelCount();
      const nextId = Number(currentCount) + 1;

      setDeployStep("Encrypting weights & IPFS pinning...");
      const { cid, encryptionHash } = await secureUpload(file, nextId.toString(), CONTRACT_ADDRESS);

      setDeployStep("Waiting for transaction signature...");
      const tx = await contract.registerModel(cid, ethers.parseEther(price), ethers.parseEther(subscriptionPrice));
      await tx.wait();

      setDeployStep("Finalizing Marketplace Registry...");
      const { error: dbError } = await supabase.from('models').insert({
        info: {
          model_id: nextId,
          name,
          description,
          readme,
          task,
          framework,
          price_eth: parseFloat(price),
          subscription_price_eth: parseFloat(subscriptionPrice),
          acquisition_price_eth: parseFloat(acquisitionPrice), // Saved to DB
          ipfs_cid: cid,
          lit_hash: encryptionHash,
          author: username,
          ownership_type: ownershipType,
          owners: collaborators,
          file_size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        }
      });
      if (dbError) throw dbError;

      setDeployStep("✓ Successfully registered!");
      setTimeout(() => router.push('/dashboard/models'), 1200);
    } catch (e: any) {
      alert(e.message || "Deployment failed.");
      setDeployStep("");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] py-12 px-4 pb-32">
      <header className="mb-10 border-b border-zinc-100 pb-8">
        <h1 className="text-3xl font-black tracking-tighter text-black uppercase italic">Register Weights</h1>
        <p className="mt-1 text-sm text-zinc-500 uppercase tracking-widest font-bold">Secure Marketplace Deployment</p>
      </header>

      <div className="space-y-12">
        {/* SECTION 1: Ownership Management */}
        <section className="space-y-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Ownership Management</label>
          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => {setOwnershipType('single'); setCollaborators([{username: username!, share: 100}])}} className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${ownershipType === 'single' ? 'border-black bg-white shadow-md' : 'border-zinc-100 text-zinc-400'}`}>
                <User size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Single Owner</span>
             </button>
             <button onClick={() => setOwnershipType('multi')} className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${ownershipType === 'multi' ? 'border-black bg-white shadow-md' : 'border-zinc-100 text-zinc-400'}`}>
                <Users size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Multi Ownership Split</span>
             </button>
          </div>

          {ownershipType === 'multi' && (
            <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                  <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search handles to add as owners..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm focus:border-black outline-none" />
                  {searchResults.length > 0 && (
                    <div className="absolute z-1000 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-2xl overflow-hidden">
                       {searchResults.map(u => (
                         <button key={u.username} onClick={() => addCollaborator(u.username)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50 text-left font-bold border-b last:border-0 border-zinc-50">
                            <div className="h-6 w-6 rounded bg-black text-white flex items-center justify-center text-[10px] font-black uppercase">{u.username.charAt(0)}</div>
                            <span>@{u.username}</span>
                            <UserPlus size={14} className="ml-auto text-zinc-300" />
                         </button>
                       ))}
                    </div>
                  )}
               </div>

               <div className="space-y-1 border border-zinc-100 rounded-xl overflow-hidden bg-zinc-50/30">
                  {collaborators.map((c, i) => (
                    <div key={c.username} className="flex items-center justify-between p-4 bg-white border-b last:border-0">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] font-bold">{c.username.charAt(0).toUpperCase()}</div>
                          <p className="text-sm font-bold text-black">@{c.username} {c.username === username && "(You)"}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="relative">
                            <input type="number" value={c.share} onChange={(e) => updateShare(i, parseInt(e.target.value) || 0)} className="w-20 pr-6 pl-3 py-1.5 border border-zinc-200 rounded-lg text-sm font-mono font-bold text-right outline-none focus:border-black" />
                            <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                          </div>
                          {c.username !== username && <button onClick={() => setCollaborators(collaborators.filter(col => col.username !== c.username))} className="p-1.5 text-zinc-300 hover:text-red-500"><X size={16}/></button>}
                       </div>
                    </div>
                  ))}
                  <div className={`p-3 text-center text-[10px] font-black uppercase tracking-widest ${totalShare === 100 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    Total Allocation: {totalShare}% {totalShare !== 100 && `(Requires ${100 - totalShare}% more)`}
                  </div>
               </div>
            </div>
          )}
        </section>

        {/* SECTION 2: Identity */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-400">Model Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-black outline-none font-bold" placeholder="llama-3-edge" />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-400">Card Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-black outline-none" placeholder="e.g. Ultra-fast text completion" />
          </div>
        </section>

        {/* SECTION 3: Task & Pricing (Updated with Buyout) */}
        <section className="space-y-6">
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><LayoutGrid size={14}/> Pipeline Selection</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MODEL_TASKS.map((t) => (
                <button key={t.id} onClick={() => setTask(t.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${task === t.id ? 'border-black bg-white shadow-md' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200'}`}>
                  <div className={`mb-3 p-2 rounded-lg w-fit ${task === t.id ? 'bg-black text-white' : 'bg-white text-zinc-400'}`}>{t.icon}</div>
                  <p className="text-xs font-bold">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Framework</label>
              <select value={framework} onChange={(e) => setFramework(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none font-bold">
                <option value="onnx">ONNX</option><option value="pytorch">PyTorch</option>
              </select>
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Usage Fee</label>
              <div className="relative"><input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm font-mono outline-none" placeholder="0.001" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase">ETH</span></div>
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Subscription</label>
              <div className="relative"><input value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} type="number" className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm font-mono outline-none" placeholder="0.05" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase">ETH</span></div>
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-blue-600">Buyout Price</label>
              <div className="relative"><input value={acquisitionPrice} onChange={(e) => setAcquisitionPrice(e.target.value)} type="number" className="w-full rounded-lg border-2 border-blue-100 bg-blue-50/20 px-4 py-2 text-sm font-mono outline-none focus:border-blue-500 transition-all" placeholder="10.0" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400 uppercase">ETH</span></div>
            </div>
          </div>
        </section>

        {/* SECTION 4: README */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-400"><BookOpen size={14} /> Technical Documentation</label>
          <textarea value={readme} onChange={(e) => setReadme(e.target.value)} rows={6} className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm font-mono focus:border-black outline-none transition-all shadow-inner" placeholder="# README.md" />
        </section>

        {/* SECTION 5: Weights Upload */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-950 p-8">
          <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">Model Shards</label>
          {!file ? (
            <div className="relative group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 py-14 hover:border-white transition-all cursor-pointer">
              <Upload size={32} className="text-zinc-600 mb-2" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Weights</p>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-lg text-black font-mono"><FileCode size={24} /></div>
                <div className="text-white"><p className="text-sm font-black">{file.name}</p><p className="text-[11px] font-mono text-zinc-500 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
              </div>
              <button onClick={() => setFile(null)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-zinc-200">
          <div className="flex items-center gap-3 bg-zinc-50 p-5 rounded-xl mb-8 border border-zinc-100">
            <ShieldCheck size={24} className="text-zinc-400 shrink-0" />
            <p className="text-[11px] text-zinc-500 leading-relaxed uppercase tracking-tighter">
              Weights are encrypted and ownership is verified on Sepolia. The <span className="text-blue-600 font-bold">Buyout Price</span> will be the listed price for 100% ownership transfer in the marketplace.
            </p>
          </div>

          <button onClick={handleSubmit} disabled={isDeploying || !file || !name || !price || !subscriptionPrice || !task || !acquisitionPrice || (ownershipType === 'multi' && totalShare !== 100)} className="w-full md:w-auto min-w-[240px] flex items-center justify-center gap-3 rounded-xl bg-black py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-xl shadow-black/20">
            {isDeploying ? <Loader2 className="animate-spin" /> : <><Zap size={18} /> Initialize Model</>}
          </button>
        </div>
      </div>
    </div>
  );
}