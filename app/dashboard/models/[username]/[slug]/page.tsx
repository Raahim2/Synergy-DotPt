"use client";

import React, { useState, useEffect, use } from 'react'; // 1. Added 'use'
import { useRouter } from 'next/navigation'; // 2. Removed useParams
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkFrontmatter from 'remark-frontmatter';
import { 
  Play, Zap, Loader2, Settings, 
  Search, BookOpen, 
  Image as ImageIcon, UserPlus, Trash2, Check, Percent, ArrowRightLeft
} from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

const TASKS = [
  { id: "text-to-text", label: "Text Generation" },
  { id: "text-to-image", label: "Text to Image" }
];

interface Owner {
  username: string;
  share: number;
}

// 3. Define the type for the props
type PageProps = {
  params: Promise<{ username: string; slug: string }>;
};

export default function ModelDetailPage({ params }: PageProps) {
  // 4. Unwrap params using the 'use' hook
  const resolvedParams = use(params);
  const username = resolvedParams.username;
  const slug = resolvedParams.slug;

  const router = useRouter();
  const supabase = createClient();
  
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playground');
  
  // Auth & Permissions
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Playground States
  const [inputText, setInputText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  // Settings: General
  const [editData, setEditData] = useState({ name: "", description: "", task: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  // Settings: Collaborators
  const [collaborators, setCollaborators] = useState<Owner[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Settings: Transfer & Delete
  const [transferTarget, setTransferTarget] = useState("");
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      let currentHandle = "";
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (profile) {
          setCurrentUser(profile.username);
          currentHandle = profile.username;
        }
      }

      // Fetch model across namespaces
      const { data: allModels } = await supabase.from('models').select('*');
      const targetModel = allModels?.find((m: any) => {
        const matchesAuthor = m.info.author.toLowerCase() === username.toLowerCase();
        const matchesSlug = m.info.name.toLowerCase().replace(/\s+/g, '-') === slug;
        return matchesAuthor && matchesSlug;
      });

      if (targetModel) {
        setModel(targetModel);
        setEditData({ 
          name: targetModel.info.name, 
          description: targetModel.info.description, 
          task: targetModel.info.task 
        });
        
        const ownersList = targetModel.info.owners || [{ username: targetModel.info.author, share: 100 }];
        setCollaborators(ownersList);
        
        if (ownersList.some((o: Owner) => o.username === currentHandle)) setIsOwner(true);
      }
      setLoading(false);
    }
    init();
  }, [username, slug, supabase]); // Removed currentUser from deps to avoid unnecessary re-runs

  // ... (Keep all your existing handler functions: handleUpdateGeneral, syncCollaborators, etc.)
  
  const handleUpdateGeneral = async () => {
    setIsUpdating(true);
    try {
      const updatedInfo = { ...model.info, ...editData };
      const { error } = await supabase.from('models').update({ info: updatedInfo }).eq('id', model.id);
      if (error) throw error;

      const newSlug = editData.name.toLowerCase().replace(/\s+/g, '-');
      router.push(`/dashboard/models/${username}/${newSlug}`);
      router.refresh();
      alert("Settings persisted.");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const syncCollaborators = async (newList: Owner[]) => {
    try {
      const updatedInfo = { ...model.info, owners: newList };
      const { error } = await supabase.from('models').update({ info: updatedInfo }).eq('id', model.id);
      if (error) throw error;
      setCollaborators(newList);
      setModel({...model, info: updatedInfo});
    } catch (e: any) {
      alert("Sync failed: " + e.message);
    }
  };

  const updateShare = (idx: number, val: number) => {
    const updated = [...collaborators];
    updated[idx].share = val;
    setCollaborators(updated);
  };

  const handleTransfer = async () => {
    if (confirmName !== model.info.name) return alert("Confirmation name mismatch.");
    setIsUpdating(true);
    try {
      const newInfo = { 
        ...model.info, 
        author: transferTarget, 
        owners: [{ username: transferTarget, share: 100 }] 
      };
      const { error } = await supabase.from('models').update({ info: newInfo }).eq('id', model.id);
      if (error) throw error;

      router.push(`/dashboard/models/${transferTarget.toLowerCase()}/${slug}`);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirmName !== model.info.name) return;
    const { error } = await supabase.from('models').delete().eq('id', model.id);
    if (!error) router.push('/dashboard/models');
  };

  useEffect(() => {
    if (userSearch.length < 2) return setSearchResults([]);
    const search = async () => {
      const { data } = await supabase.from('profiles').select('username').ilike('username', `%${userSearch}%`).neq('username', currentUser).limit(5);
      setSearchResults(data || []);
    };
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [userSearch, currentUser, supabase]);

  const handleRunInference = () => {
    setIsRunning(true);
    setTimeout(() => {
      setPrediction({
        output: info.task === 'text-to-image' 
          ? `https://image.pollinations.ai/prompt/${encodeURIComponent(inputText)}?width=1024&height=1024&nologo=true`
          : inputText,
        latency: "0.92s"
      });
      setIsRunning(false);
    }, 1500);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-gray-400">Syncing Registry...</div>;
  if (!model) return <div className="h-screen flex items-center justify-center font-bold">404: Node Missing</div>;

  const { info } = model;
  const totalShare = collaborators.reduce((a, b) => a + b.share, 0);

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">
        {/* ... (Keep your existing JSX) ... */}
        <header className="mx-auto max-w-[1200px] px-8 pt-10 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
              <span className="text-gray-400 font-normal">{username}</span> <span className="text-gray-200">/</span> <span className="font-bold">{info.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-gray-500 uppercase">
               <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold border border-blue-100">{info.task}</span>
               <span className="flex items-center gap-1 font-mono text-black bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200"><Zap size={12}/> {info.price_eth} ETH</span>
               <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4 text-gray-400 font-bold">
                 Owners: {collaborators.map(o => <span key={o.username} title={`${o.share}% ownership`} className="text-black font-mono cursor-help bg-gray-50 px-1 rounded">@{o.username}</span>)}
               </div>
            </div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(info.ipfs_cid)} className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-bold shadow-sm hover:bg-gray-50 transition-all">Copy CID</button>
        </div>

        <nav className="mt-8 flex border-b border-gray-100">
          <Tab active={activeTab === 'playground'} onClick={() => setActiveTab('playground')} icon={<Play size={14}/>} label="Playground" />
          <Tab active={activeTab === 'readme'} onClick={() => setActiveTab('readme')} icon={<BookOpen size={14}/>} label="README" />
          {isOwner && <Tab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={14}/>} label="Settings" />}
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-8 py-10">
        
        {/* TABS CONTENT */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-in fade-in duration-300">
            <div className="space-y-4">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Input</h2>
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full min-h-[200px] rounded-xl border border-gray-200 p-4 text-sm focus:ring-1 focus:ring-black outline-none shadow-sm transition-all" placeholder="Model prompt..." />
              <div className="flex justify-end gap-3 pt-2">
                 <button onClick={() => {setInputText(""); setPrediction(null);}} className="px-5 py-2 border border-gray-200 rounded-md text-xs font-bold hover:bg-gray-50">Reset</button>
                 <button onClick={handleRunInference} disabled={isRunning || !inputText} className="px-10 py-2 bg-black text-white rounded-md text-xs font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-xl">
                    {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="white"/>} Run
                 </button>
              </div>
            </div>
            <div className="space-y-4">
               <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Output</h2>
               <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-6 min-h-[300px] flex items-center justify-center">
                  {prediction ? (
                    <div className="w-full space-y-4 animate-in fade-in">
                       {info.task === 'text-to-image' ? <img src={prediction.output} className="w-full rounded-lg shadow-2xl border bg-white" /> : <div className="bg-white p-6 rounded-xl border border-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{prediction.output}</div>}
                       <div className="flex justify-between font-mono text-[10px] text-gray-400"><span>Status: Succeeded</span> <span>{prediction.latency}</span></div>
                    </div>
                  ) : <p className="text-sm text-gray-400 italic font-medium">Awaiting prompt...</p>}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-12 animate-in slide-in-from-bottom-2">
            {/* General Config */}
            <section className="space-y-6">
               <h3 className="text-lg font-bold tracking-tight border-b border-gray-50 pb-4">General Configuration</h3>
               <div className="grid gap-6 max-w-lg">
                  <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-gray-400">Name</label><input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-black font-bold" /></div>
                  <div className="space-y-1.5"><label className="text-[11px] font-black uppercase text-gray-400">Task</label><select value={editData.task} onChange={(e) => setEditData({...editData, task: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white font-bold cursor-pointer">{TASKS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
                  <button onClick={handleUpdateGeneral} disabled={isUpdating} className="w-fit px-6 py-2 bg-black text-white rounded-md text-xs font-bold hover:bg-zinc-800 transition-all flex items-center gap-2">Save Settings</button>
               </div>
            </section>

            {/* Access Control (Collaborators with Shares) */}
            <section className="space-y-6">
               <h3 className="text-lg font-bold tracking-tight border-b border-gray-50 pb-4">Revenue & Ownership Splits</h3>
               <div className="max-w-lg space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search for handle..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-black" />
                    {searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-2xl py-1 overflow-hidden">
                        {searchResults.map(u => (
                          <button key={u.username} onClick={() => syncCollaborators([...collaborators, { username: u.username, share: 0 }])} className="w-full px-4 py-2 text-xs text-left hover:bg-zinc-50 flex items-center justify-between font-bold">
                             @{u.username} <UserPlus size={14} className="text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                     {collaborators.map((c, i) => (
                       <div key={c.username} className="flex items-center justify-between p-4 bg-white">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">@{c.username}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{c.username === info.author ? "Primary" : "Collaborator"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="relative">
                               <input type="number" value={c.share} onChange={(e) => updateShare(i, parseInt(e.target.value) || 0)} className="w-16 pr-6 pl-2 py-1.5 border border-gray-100 rounded bg-gray-50 text-xs font-mono font-bold text-right outline-none focus:border-black" />
                               <Percent size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
                             </div>
                             {c.username !== currentUser && <button onClick={() => syncCollaborators(collaborators.filter(col => col.username !== c.username))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>}
                          </div>
                       </div>
                     ))}
                     <div className={`p-3 text-center text-[10px] font-black uppercase tracking-widest ${totalShare === 100 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        Total Split: {totalShare}% {totalShare !== 100 && `(Must be 100%)`}
                     </div>
                  </div>
                  <button onClick={() => syncCollaborators(collaborators)} disabled={totalShare !== 100} className="w-full py-2 bg-zinc-100 text-zinc-500 rounded text-[11px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30">Confirm Splits</button>
               </div>
            </section>

            {/* Danger Zone (Transfer & Delete) */}
            <section className="pt-4">
               <div className="rounded-xl border border-red-200 overflow-hidden bg-red-50/10">
                  <div className="p-4 border-b border-red-100 text-red-800 font-bold text-xs uppercase tracking-widest">Danger Zone</div>
                  <div className="p-6 bg-white space-y-8">
                    <div className="flex items-center justify-between">
                       <div><p className="font-bold text-sm">Transfer Ownership</p><p className="text-xs text-gray-500 mt-0.5">Change the namespace of this model.</p></div>
                       <button onClick={() => setConfirmName("TRANSFER_INIT")} className="px-4 py-1.5 border border-red-200 text-red-600 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition-all">Transfer</button>
                    </div>

                    {confirmName === "TRANSFER_INIT" && (
                       <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 animate-in zoom-in-95 space-y-4">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">New Owner Handle</label>
                          <input value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded text-sm outline-none focus:border-black" placeholder="Handle..." />
                          <p className="text-xs text-zinc-500">Type <span className="font-bold text-black font-mono">{info.name}</span> to confirm:</p>
                          <input onChange={(e) => setConfirmName(e.target.value === info.name ? 'CONFIRMED_X' : 'TRANSFER_INIT')} className="w-full px-3 py-2 border border-zinc-200 rounded text-sm outline-none focus:border-black" />
                          <button onClick={handleTransfer}  className="w-full py-2.5 bg-black text-white rounded text-xs font-black uppercase tracking-widest hover:bg-zinc-800 flex items-center justify-center gap-2 transition-all">
                             <ArrowRightLeft size={14}/> Complete Transfer
                          </button>
                       </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                       <div><p className="font-bold text-sm">Delete Model</p><p className="text-xs text-gray-500 mt-0.5">Remove this registry entry permanently.</p></div>
                       <button onClick={() => setConfirmName("DELETE_INIT")} className="px-4 py-1.5 border border-red-200 text-red-600 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition-all">Delete</button>
                    </div>

                    {confirmName === "DELETE_INIT" && (
                      <div className="animate-in slide-in-from-top-2 space-y-3 pt-4 border-t border-zinc-100">
                        <p className="text-[10px] font-black uppercase text-red-600">Type "{info.name}" to confirm deletion:</p>
                        <input onChange={(e) => setConfirmName(e.target.value === info.name ? 'READY_DELETE' : 'DELETE_INIT')} className="w-full px-3 py-2 border border-red-200 rounded text-sm outline-none" />
                        <button onClick={handleDelete} className="w-full py-2.5 bg-red-600 text-white rounded text-xs font-black uppercase tracking-widest shadow-lg shadow-red-200">Permanently Delete</button>
                      </div>
                    )}
                  </div>
               </div>
            </section>
          </div>
        )}

        {activeTab === 'readme' && (
          <div className="max-w-4xl animate-in fade-in duration-500 pb-20">
            <div className="prose prose-zinc prose-sm md:prose-base max-w-none prose-pre:bg-gray-50 prose-pre:text-black prose-code:text-blue-600 prose-headings:tracking-tighter">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkFrontmatter]} rehypePlugins={[rehypeRaw]}>{info.readme}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const Tab = ({ active, label, icon, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-5 py-4 text-[13px] font-bold uppercase tracking-widest transition-all border-b-2 -mb-[1px] ${active ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}>
    {icon} {label}
  </button>
);