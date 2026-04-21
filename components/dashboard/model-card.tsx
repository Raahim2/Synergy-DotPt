import React from 'react';
import { 
  Github, 
  GitBranch, 
  MoreHorizontal, 
  Activity, 
  Shield, 
  Layers, 
  Download, 
  Heart,
  ExternalLink,
  Zap,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface ModelCardProps {
  author: string;
  name: string;
  type: string;        // Framework (onnx, pytorch)
  task: string;        // Task (text-to-text, text-to-image)
  price: number;       // ETH Price
  ownersCount: number; // Number of collaborators
  updatedAt: string;
  downloads: string;
  likes: string;
}

export const ModelCard = ({ 
  author, name, type, task, price, ownersCount, updatedAt, downloads, likes 
}: ModelCardProps) => {

  const modelSlug = name.toLowerCase().replace(/\s+/g, '-');
  const detailHref = `/dashboard/models/${author.toLowerCase()}/${modelSlug}`;

  return (
    <Link href={detailHref} className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md">
      
      {/* Top Section: Identity & Status */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black text-white shadow-inner transition-transform group-hover:scale-105">
            <Shield size={24} strokeWidth={1.5} />
          </div>
          
          <div className="flex flex-col min-w-0">
            <h3 className="text-[16px] font-bold tracking-tight text-black group-hover:underline decoration-1 underline-offset-2 truncate">
              {name}
            </h3>
            <div className="flex items-center gap-2">
               <p className="text-sm text-gray-500 font-medium">@{author.toLowerCase()}</p>
               {ownersCount > 1 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 border border-zinc-200">
                    <Users size={10} /> {ownersCount}
                  </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-400 group-hover:text-green-500 transition-colors">
            <Activity size={16} />
          </div>
        </div>
      </div>

      {/* Middle Section: Metadata Pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-700">
           <Zap size={10} fill="currentColor" /> {price} ETH
        </div>
        <div className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
           {task}
        </div>
        <div className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
           {type}
        </div>
      </div>

      {/* URL & Update Info */}
      <div className="mt-4 space-y-1">
        <div className="flex items-center gap-2 text-[13px] font-medium text-black">
          <span className="truncate text-gray-400">platform.ai/</span>
          <span className="truncate">{author}/{modelSlug}</span>
          <ExternalLink size={12} className="text-gray-300 ml-auto" />
        </div>
        <p className="text-[11px] text-gray-400">
          Updated {updatedAt}
        </p>
      </div>

      {/* Footer: Technical Stats */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
          <div className="flex items-center gap-1.5 hover:text-black transition-colors">
            <Layers size={13} />
            <span className="font-mono">CID</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-black transition-colors">
            <Download size={13} />
            <span className="font-mono">{downloads}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-[12px] font-bold text-gray-600 border border-gray-100">
          <Heart size={12} className="text-gray-400 group-hover:text-red-500 group-hover:fill-red-500 transition-all" />
          {likes}
        </div>
      </div>

    </Link>
  );
};