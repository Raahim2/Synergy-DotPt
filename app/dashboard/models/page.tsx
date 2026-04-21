import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ModelCard } from "@/components/dashboard/model-card";
import { Plus, Box, Search, Filter, ArrowRight } from "lucide-react";

export default async function ModelsPage() {
  const supabase = await createClient();
  
  // 1. Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. Fetch the user's profile to get the username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const username = profile?.username;

  console.log("--- DEBUG: Fetching models for user:", username);

  // 3. Fetch models where info->author matches our username
  // Using the ->> operator is the most compatible way to query Supabase JSON
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('*')
    .filter('info->>author', 'eq', username) 
    .order('created_at', { ascending: false });

  if (modelsError) {
    console.error("--- DEBUG: Supabase Error:", modelsError.message);
  }

  console.log("--- DEBUG: Models found:", models?.length || 0);

  const hasModels = models && models.length > 0;

  return (
    <div className="mx-auto max-w-6xl py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-black uppercase italic">My Models</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registry handle: <span className="font-mono text-black font-bold">@{username}</span>
          </p>
        </div>

        <Link 
          href="/dashboard/models/new" 
          className="bg-black text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center gap-2"
        >
          <Plus size={16} /> Register Weights
        </Link>
      </div>

      {hasModels ? (
        <>
          {/* Search/Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Filter your repository..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:border-black transition-all">
              <Filter size={14} />
              Refine
            </button>
          </div>

          {/* Model Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model) => {
              // Safely extract from JSON
              const info = model.info || {};
              
              return (
                <ModelCard 
                  key={model.id}
                  author={info.author || username}
                  name={info.name || "Untitled Model"}
                  type={info.framework || "onnx"}
                  task={info.task || "General Inference"}
                  price={info.price_eth || 0}
                  ownersCount={info.owners?.length || 1}
                  updatedAt={new Date(model.created_at).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  downloads="0" 
                  likes="0"
                />
              );
            })}
          </div>
        </>
      ) : (
        /* Empty State UI */
        <div className="mt-12 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-zinc-200 py-32 text-center bg-zinc-50/30">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100 mb-6">
            <Box size={36} className="text-zinc-300" />
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight uppercase">Registry Empty</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500 leading-relaxed mx-auto">
            You haven't initialized any model weights yet. Start by pinning your weights to IPFS.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/dashboard/models/new" 
              className="flex items-center gap-3 rounded-xl bg-black px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-800 transition-all shadow-2xl shadow-black/20"
            >
              <Plus size={18} />
              New Deployment
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}