"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Box, 
  Database, 
  Cpu, 
  Terminal, 
  History, 
  Star, 
  Settings, 
  HelpCircle, 
  Plus,
  ChevronDown,
  Globe,
  LogOut // Added Logout Icon
} from 'lucide-react';
import { createClient } from "@/lib/supabase/client"; // Ensure this path matches your setup

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect to landing page after logout
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error("Logout Error:", error.message);
    }
  };

  return (
    <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r border-gray-200 bg-white p-4">
      <div className="flex flex-col h-full">
        
        {/* Organization Switcher */}
        <div className="mb-6">
          <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-black text-[10px] font-bold text-white uppercase">
                P
              </div>
              <span className="text-sm font-semibold text-black">Personal Space</span>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 space-y-6 overflow-y-auto">
          
          <SidebarGroup title="Platform">
            <SidebarItem icon={<LayoutDashboard size={18} />} label="Overview" href="/dashboard/overview" currentPath={pathname} />
            <SidebarItem icon={<Box size={18} />} label="My Models" href="/dashboard/models" currentPath={pathname} />
            <SidebarItem icon={<Database size={18} />} label="Marketplace" href="/marketplace" currentPath={pathname} />
            <SidebarItem icon={<Cpu size={18} />} label="Testing" href="/dashboard/testing" currentPath={pathname} />
          </SidebarGroup>

          <SidebarGroup title="Activity">
            <SidebarItem icon={<Star size={18} />} label="Favorites" href="/dashboard/favorites" currentPath={pathname} />
            <SidebarItem icon={<History size={18} />} label="Recent Logs" href="/dashboard/logs" currentPath={pathname} />
            <SidebarItem icon={<Terminal size={18} />} label="Deployments" href="/dashboard/deployments" currentPath={pathname} />
          </SidebarGroup>

        

        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-100 pt-4 space-y-1">
          <SidebarItem icon={<Settings size={18} />} label="Settings" href="/settings" currentPath={pathname} />
          
          {/* LOGOUT BUTTON */}
          <button 
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-all mt-2"
          >
            <LogOut size={18} className="text-red-400 group-hover:text-red-600" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </aside>
  );
};

/* --- Helper Components --- */

const SidebarGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
      {title}
    </h3>
    {children}
  </div>
);

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  currentPath: string;
  count?: number;
}

const SidebarItem = ({ icon, label, href, currentPath, count }: SidebarItemProps) => {
  const isActive = currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href));

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-md px-3 py-2 transition-all ${
        isActive 
          ? 'bg-black text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-black'
      }`}
    >
      <div className="flex items-center gap-3 text-sm font-medium">
        <span className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-black transition-colors'}`}>
          {icon}
        </span>
        {label}
      </div>
      {count !== undefined && (
        <span className={`text-[11px] font-bold ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>
          {count}
        </span>
      )}
    </Link>
  );
};

export default Sidebar;