import { useUser, useLogout } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  LogOut,
  Settings,
  Info,
  Bell,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { data, isLoading } = useUser();
  const logout = useLogout();

  // Handle data structure: adapting to your API response nesting
  const user = data?.data?.user;
  const isAuthenticated = !!user;
  const firstLetter = (user?.name || user?.email || '?')
    .charAt(0)
    .toUpperCase();

  return (
    <header className="h-16 border-b border-white/5 bg-[#080808] sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-350 mx-auto h-full px-6 md:px-10 flex items-center justify-between">
        {/* LEFT SIDE: Identity & Navigation */}
        <div className="flex items-center gap-10">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-sm font-bold tracking-[0.4em] text-white hover:opacity-80 transition-opacity"
          >
            <Layers size={20} className="text-sky-500 fill-sky-500/10" />
            STOREX
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/dashboard" className="group flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                Dashboard
              </span>
              <div className="h-1 w-1 rounded-full bg-sky-500 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
            <Link to="/" className="group flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                About
              </span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-4 w-px bg-white/5 mx-2 hidden sm:block" />

          {isLoading ? (
            <div className="h-8 w-8 rounded-lg bg-white/5 animate-pulse border border-white/5" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none flex items-center gap-3 py-1 group">
                  <div className="flex-col items-end mr-1 hidden sm:flex">
                    <span className="text-[18px] font-bold text-white ">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    <span className="text-[8px] font-mono text-emerald-500 tracking-widest mt-1 uppercase">
                      Node_Active
                    </span>
                  </div>
                  <Avatar className="h-9 w-9 rounded-[50%] border-white/10 group-hover:border-sky-500/50 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-all duration-300">
                    <AvatarFallback className="bg-linear-to-br from-sky-500/20 to-sky-500/5 text-sky-400 font-bold text-xs">
                      {firstLetter}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-64 bg-[#0c0c0c] border border-white/10 text-slate-400 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-2 backdrop-blur-xl"
              >
                <div className="px-4 py-4 mb-2 bg-white/2 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={12} className="text-sky-500" />
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Verified_Access
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.email}
                  </p>
                </div>

                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-white/5 focus:text-white transition-colors">
                  <Settings size={14} className="text-slate-500" />
                  <span className="text-xs font-medium">Console Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-white/5 focus:text-white transition-colors">
                  <Info size={14} className="text-slate-500" />
                  <span className="text-xs font-medium">
                    System Documentation
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/5 my-2" />

                <DropdownMenuItem
                  onClick={() => logout.mutate()}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg focus:bg-rose-500/10 text-rose-400 focus:text-rose-400 transition-colors"
                >
                  <LogOut size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    Terminate_Session
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-3 px-5 py-2 rounded-xl border border-sky-500/20 bg-sky-500/5 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/40 transition-all group active:scale-95"
            >
              <LogIn
                size={15}
                className="group-hover:translate-x-0.5 transition-transform"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Initialize_Entry
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
