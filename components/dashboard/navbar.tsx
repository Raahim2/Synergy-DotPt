import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  Box, 
  Database, 
  LayoutGrid, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  CircleDollarSign, 
  MoreHorizontal,
  UserCircle
} from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white font-sans antialiased">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center px-4">
        
        {/* Left Section: Logo & Search */}
        <div className="flex items-center gap-4 flex-1">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <ShieldCheck size={20} className="text-black" />
            <span className="text-[15px] font-bold tracking-tight text-black">
              DOT PT
            </span>
          </Link>

          <div className="relative w-full max-w-sm hidden md:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search models, datasets, users..."
              className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm transition-all focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="flex items-center gap-1 lg:gap-2">
          <NavItem icon={<Box size={16} />} label="Models" href="/models" />
          <NavItem icon={<Database size={16} />} label="Datasets" href="/datasets" />
          <NavItem icon={<LayoutGrid size={16} />} label="Spaces" href="/spaces" />
          <NavItem icon={<BookOpen size={16} />} label="Docs" href="/docs" />
          
          <div className="hidden xl:flex items-center gap-1">
            <div className="h-4 w-[1px] bg-gray-200 mx-2" />
            <NavItem icon={<ShieldCheck size={16} />} label="Enterprise" href="/enterprise" />
            <NavItem icon={<CircleDollarSign size={16} />} label="Pricing" href="/pricing" />
          </div>

          <div className="flex items-center gap-2 ml-2">
             
             <div className="h-4 w-[1px] bg-gray-200 mx-1" />
             <button className="flex items-center justify-center h-8 w-8 rounded-full bg-black text-white hover:opacity-80 transition-opacity overflow-hidden">
                <UserCircle size={24} strokeWidth={1.5} />
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isNew?: boolean;
}

const NavItem = ({ icon, label, href, isNew }: NavItemProps) => {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-md text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-black"
    >
      <span className="text-gray-400 group-hover:text-black transition-colors">
        {icon}
      </span>
      <span>{label}</span>
      {isNew && (
        <span className="ml-1 rounded bg-black px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          New
        </span>
      )}
    </Link>
  );
};

export default Navbar;