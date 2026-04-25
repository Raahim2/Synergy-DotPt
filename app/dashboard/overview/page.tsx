"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, ChevronRight, BarChart3, Users, 
  Activity, Globe, ArrowUpRight, Loader2, PackageOpen 
} from 'lucide-react';
import { ModelCard } from "@/components/dashboard/model-card";
import { createClient } from "@/lib/supabase/client";

const STATS = [
  { label: "Total Requests", value: "45.2k", trend: "+12.5%", icon: <BarChart3 size={16} /> },
  { label: "Avg. Latency", value: "84ms", trend: "-2ms", icon: <Activity size={16} /> },
  { label: "Active Users", value: "1,204", trend: "+48", icon: <Users size={16} /> },
  { label: "Uptime", value: "99.99%", trend: "Stable", icon: <Globe size={16} /> },
];

const usageData = [
  { day: 'Mon', requests: 120 }, { day: 'Tue', requests: 210 },
  { day: 'Wed', requests: 450 }, { day: 'Thu', requests: 380 },
  { day: 'Fri', requests: 520 }, { day: 'Sat', requests: 300 },
  { day: 'Sun', requests: 410 },
];

export default function OverviewPage() {
  const supabase = createClient();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestModels() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();

      if (profile?.username) {
        const { data: latestModels } = await supabase
          .from('models')
          .select('*')
          .filter('info->>author', 'eq', profile.username)
          .order('created_at', { ascending: false })
          .limit(2);

        if (latestModels) setModels(latestModels);
      }
      setLoading(false);
    }
    fetchLatestModels();
  }, [supabase]);

  return (
    <div className="space-y-8 pb-20">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight uppercase italic">Workspace Overview</h1>
          <p className="text-sm text-gray-500">Registry status and deployment metrics.</p>
        </div>
        <Link href="/dashboard/models/new" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-xl shadow-black/10">
          <Plus size={16} /> Register Model
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-400 transition-all">
            <div className="flex items-center justify-between text-gray-400 group-hover:text-black">
              {stat.icon}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-50 text-zinc-500 tracking-widest">{stat.trend}</span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{stat.label}</p>
              <p className="text-2xl font-black font-mono tracking-tighter text-black mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">Usage trend <span className="font-normal lowercase tracking-normal">(7 days)</span></h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1 underline underline-offset-4">Full Logs <ArrowUpRight size={12} /></button>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} dy={10} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '10px', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="requests" stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#usageGradient)" />
              <defs><linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#000" stopOpacity={0.05}/><stop offset="95%" stopColor="#000" stopOpacity={0}/></linearGradient></defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Recent Deployments</h2>

        {loading ? (
          <div className="flex h-32 w-full items-center justify-center"><Loader2 className="animate-spin text-gray-200" size={24} /></div>
        ) : models.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => {
              const { name, author, framework, task, price_eth, owners } = model.info;
              return (
                <ModelCard 
                  key={model.id}
                  author={author}
                  name={name}
                  type={framework}
                  task={task || "General Inference"}
                  price={price_eth || 0}
                  ownersCount={owners?.length || 1}
                  updatedAt={new Date(model.created_at).toLocaleDateString()}
                  downloads="1.2k"
                  likes="42"
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center bg-gray-50/50">
            <PackageOpen className="text-gray-300 mb-2" size={32} />
            <p className="text-sm font-bold text-black uppercase tracking-tighter">No active deployments</p>
          </div>
        )}
        
        {models.length > 0 && (
          <Link href="/dashboard/models" className="w-full py-3 mt-4 border border-dashed border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black hover:border-gray-400 transition-all flex items-center justify-center gap-2">
            View full registry <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}