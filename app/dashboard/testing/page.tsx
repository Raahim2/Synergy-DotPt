"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Play, 
  Search, 
  ChevronDown, 
  Activity, 
  Cpu, 
  Clock, 
  ShieldCheck,
  Check,
  Loader2,
  Layers,
  FlaskConical,
  Terminal as TerminalIcon,
  Settings2,
  History,
  Info
} from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

const MOCK_METRICS = [
  { name: 'Accuracy', value: 94.2 },
  { name: 'Precision', value: 91.8 },
  { name: 'Recall', value: 89.5 },
  { name: 'F1 Score', value: 93.1 },
];

export default function TestingWorkbench() {
  const supabase = createClient();
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function fetchModels() {
      const { data } = await supabase.from('models').select('*');
      if (data) setModels(data);
    }
    fetchModels();
  }, [supabase]);

  const runBenchmark = () => {
    setStatus('running');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('complete');
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      
      {/* 1. Technical Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold uppercase tracking-widest">Workbench v1.0</span>
            {status === 'running' && <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse"><div className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Live Execution</span>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black flex items-center gap-3">
             Model Evaluation
          </h1>
        </div>

        <div className="flex items-center gap-3">
           <button className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
              <History size={18} className="text-zinc-400" />
           </button>
           <button 
             onClick={runBenchmark}
             disabled={!selectedModel || status === 'running'}
             className="bg-black text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-zinc-800 disabled:opacity-20 transition-all flex items-center gap-2 shadow-lg shadow-black/10"
           >
             {status === 'running' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="white" />}
             Start Analysis
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* 2. Left Rail: Selection & Config */}
        <aside className="lg:col-span-4 space-y-10">
          
          <section className="space-y-4">
             <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Target Environment</label>
             <div className="relative">
                <select 
                  onChange={(e) => setSelectedModel(models.find(m => m.id === parseInt(e.target.value)))}
                  className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-bold focus:border-black focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer"
                >
                  <option value="">Select model registry...</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>@{m.info.author}/{m.info.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
             </div>
          </section>

          <section className="space-y-6 pt-6 border-t border-zinc-100">
             <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                <Settings2 size={14} /> Evaluation Parameters
             </div>
             <div className="space-y-4">
                <ParamRow label="Inference" value={selectedModel?.info.framework || "N/A"} />
                <ParamRow label="Test Data" value="production_val_v4" />
                <ParamRow label="Batch size" value="64" />
                <ParamRow label="Device" value="A100_GDR6" />
             </div>
          </section>

          {status === 'running' && (
            <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100 space-y-4 animate-in slide-in-from-left-4">
               <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-500">
                  <span>SYSTEM_LOAD</span>
                  <span>{progress}%</span>
               </div>
               <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
               </div>
               <p className="text-[10px] font-mono text-zinc-400 italic">Streaming shards into memory...</p>
            </div>
          )}
        </aside>

        {/* 3. Main Stage: Metrics & Results */}
        <main className="lg:col-span-8">
           
           {status === 'idle' ? (
             <div className="h-[500px] rounded-2xl border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center p-12 bg-zinc-50/30">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 mb-6">
                   <Activity size={32} className="text-zinc-300" />
                </div>
                <h3 className="text-sm font-bold text-black uppercase tracking-widest">No Active Evaluation</h3>
                <p className="text-xs text-zinc-400 mt-2 max-w-[280px]">Select a model from the registry and click "Start Analysis" to generate benchmark metrics.</p>
             </div>
           ) : (
             <div className="space-y-10 animate-in fade-in duration-500">
                
                {/* Score Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {MOCK_METRICS.map(m => (
                      <div key={m.name} className="p-4 border border-zinc-100 rounded-xl bg-white">
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{m.name}</p>
                         <p className="text-2xl font-black font-mono mt-1 text-black tracking-tighter">{status === 'complete' ? m.value : '--'}<span className="text-xs text-zinc-300 ml-0.5">%</span></p>
                      </div>
                   ))}
                </div>

                {/* Graph Stage */}
                <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm">
                   <header className="flex items-center justify-between mb-10">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Statistical Distribution</h3>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            <div className="h-2 w-2 rounded-full bg-black" /> Current Run
                         </div>
                      </div>
                   </header>
                   <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={MOCK_METRICS}>
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fontWeight: 'bold', fill: '#A1A1AA'}} 
                              dy={10}
                            />
                            <Tooltip cursor={{fill: '#F4F4F5'}} contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '12px' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                               {MOCK_METRICS.map((_, index) => (
                                 <Cell key={`cell-${index}`} fill={status === 'complete' ? '#000' : '#E4E4E7'} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Technical Logs / Footer */}
                <div className="rounded-xl bg-zinc-950 p-6 border border-zinc-800 shadow-2xl">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <TerminalIcon size={12} /> Execution Logs
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600">UTF-8 • US-EAST</span>
                   </div>
                   <div className="font-mono text-[11px] leading-relaxed space-y-1">
                      <p className="text-zinc-500">[00:01:22] <span className="text-green-500">INIT</span> Loading model weights from IPFS...</p>
                      <p className="text-zinc-500">[00:01:24] <span className="text-green-500">SYNC</span> Weights verified. CID: QmX...821</p>
                      {status === 'complete' && <p className="text-zinc-300">[00:02:12] <span className="text-blue-500">BENCH</span> Evaluation metrics calculated successfully.</p>}
                      {status === 'running' && <p className="text-white animate-pulse">_ Awaiting next shard process...</p>}
                   </div>
                </div>

             </div>
           )}

        </main>
      </div>
    </div>
  );
}

/* --- UI HELPERS --- */

const ParamRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex items-center justify-between py-1.5 group cursor-default">
    <span className="text-[13px] font-medium text-zinc-400 group-hover:text-zinc-600 transition-colors">{label}</span>
    <span className="text-[13px] font-bold text-black border-b border-zinc-100">{value}</span>
  </div>
);