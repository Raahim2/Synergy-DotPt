"use client";

import React, { useEffect, useState, Suspense } from 'react'; // 1. Added Suspense
import { createClient } from "@/lib/supabase/client";
import { CompactModelCard } from "@/components/dashboard/compact-model-card";
import { Search, Filter, Loader2, SlidersHorizontal } from 'lucide-react';

// --- 1. THE WRAPPER COMPONENT ---
// This ensures Next.js doesn't crash during the production build
export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#fafafa]">
        <Loader2 className="animate-spin text-gray-300" size={40} />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}

// --- 2. THE ACTUAL CONTENT ---
function MarketplaceContent() {
  const supabase = createClient();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchModels() {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setModels(data);
      setLoading(false);
    }
    fetchModels();
  }, [supabase]);

  const filteredModels = models.filter(m => 
    m.info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.info.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 pt-10">
      <div className="mx-auto max-w-7xl px-4">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
                <h1 className="text-2xl font-bold tracking-tight text-black">Model Marketplace</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Discover and integrate high-performance ML models optimized for decentralized inference.
                </p>
              </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {models.length} Models Indexed
          </div>
        </header>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Filter by name or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <SlidersHorizontal size={16} />
              Framework
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              Sort: Recent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-gray-300" size={40} />
            <p className="text-sm font-medium text-gray-400">Fetching the registry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map((model) => (
              <CompactModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        {!loading && filteredModels.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-white">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No models found</p>
          </div>
        )}
      </div>
    </div>
  );
}