'use client';

import { Menu, Search } from 'lucide-react';

interface TopNavBarProps {
  toggleSidebar: () => void;
}

export default function TopNavBar({ toggleSidebar }: TopNavBarProps) {

  return (
    <>
      <header className="fixed top-0 w-full z-50 border-b border-outline-variant/30 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none flex justify-between items-center h-16 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center"
            id="sidebar-toggle"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-xl font-bold text-primary flex items-center gap-2 font-headline">
            VietElite
          </div>
          <div className="hidden md:flex items-center ml-4 text-outline cursor-pointer hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/20">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-on-surface">Cao Ngoc Giap</span>
              <span className="text-[10px] text-outline uppercase tracking-wider">Admin</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden border border-primary/10">
              <img
                alt="Admin"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB060I_706YlyVRXj6R-FcXOCAx18x-5Upy14wrxSntURmERutVYewvmYmJVAMtHZyHMQsjhv_t_X8X3FGW2eOLV_XyYNrUR2k2EDsWwYRpg7HikRPHgajn7NIF680jsTtEhLOJJgR0J6kRI-DS53K8nBzwmPWDXUltePrMMRrHDG3v1fHZ9_E34lKNr4ganWs9j-ywzvEhfacKXOJJCrfFQ2X4OM2o6pnEdWDDIvwf5vR3MJQSMWDzPzkwL4Em8Xrey7MqAfcjK8M"
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
