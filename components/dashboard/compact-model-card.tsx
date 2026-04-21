import React from 'react';
import Link from 'next/link';
import { Heart, Download, Layers } from 'lucide-react';

export const CompactModelCard = ({ model }: any) => {
  const { name, author, framework, price_eth, description, task } = model.info;

  // Generate the slug: lowercase and replace spaces with hyphens
  const modelSlug = name.toLowerCase().replace(/\s+/g, '-');
  const detailHref = `/marketplace/models/${author.toLowerCase()}/${modelSlug}`;

  return (
    <Link href={detailHref} className="block group">
      <div className="h-full cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-black hover:shadow-xl hover:shadow-black/5">
        <div className="flex items-start gap-4">
          
          {/* Monogram / Icon Area */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-300 group-hover:bg-black group-hover:text-white transition-all duration-300 font-mono">
            <span className="text-xs font-black uppercase">{name.charAt(0)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-mono text-[14px] font-bold tracking-tight text-black">
                <span className="text-gray-300 font-normal">{author}/</span>{name}
              </h3>
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-600 border border-blue-100">
                {price_eth} ETH
              </span>
            </div>

            <p className="mt-1.5 truncate text-[12px] leading-relaxed text-gray-500">
              {description || "No model documentation available."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                {task || "General"}
              </span>
              <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {framework}
              </span>
              
              <div className="flex items-center gap-3 ml-auto text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                 <div className="flex items-center gap-1 group-hover:text-red-500 transition-colors">
                    <Heart size={12} /> 24
                 </div>
                 <div className="flex items-center gap-1 group-hover:text-black transition-colors">
                    <Download size={12} /> 1.2k
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};