import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bell,
  ChevronDown,
  HardDrive,
  Layers,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useLogout } from '@/hooks/useAuth';
import {
  isNavigationItemActive,
  navigationGroups,
} from '@/components/dashboard/dashboard-config';

function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <details className="group relative">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-lg bg-[#212121] px-3 transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 [&::-webkit-details-marker]:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a] text-[#ececec]">
          <HardDrive className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b4b4b4]">
            Personal
          </span>
          <span className="block truncate text-sm font-medium text-[#ececec]">
            My workspace
          </span>
        </span>
        <ChevronDown
          className="size-4 text-[#b4b4b4] transition group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-white/10 bg-[#2f2f2f] p-2 shadow-2xl shadow-black/40">
        <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e8e8e]">
          Personal
        </p>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg bg-[#2f2f2f] px-3 py-2.5 text-sm text-white"
        >
          <HardDrive className="size-4" aria-hidden="true" />
          My workspace
          <span className="ml-auto text-xs text-[#b4b4b4]">Owner</span>
        </Link>
        <div className="my-2 h-px bg-[#3a3a3a]" />
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e8e8e]">
            Organizations
          </span>
          <Link
            to="/dashboard/organizations"
            onClick={onNavigate}
            className="rounded-md p-1 text-[#b4b4b4] hover:bg-[#3a3a3a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label="Open organizations"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <p className="px-2 py-2 text-xs leading-5 text-[#b4b4b4]">
          No organization workspaces yet.
        </p>
      </div>
    </details>
  );
}

function SidebarContent({
  pathname,
  displayName,
  email,
  onNavigate,
  collapsed = false,
}: {
  pathname: string;
  displayName: string;
  email?: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const logout = useLogout();

  return (
    <div className="flex h-full flex-col bg-[#171717]">
      <div
        className={`flex h-16 items-center border-b border-white/5 ${
          collapsed ? 'justify-center px-2' : 'gap-3 px-5'
        }`}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-[#2f2f2f]">
          <Layers className="size-4 text-[#ececec]" aria-hidden="true" />
        </span>
        {!collapsed && (
          <span className="text-sm font-bold tracking-[0.28em] text-white">
            STOREX
          </span>
        )}
      </div>

      <div className="border-b border-white/5 p-3">
        {collapsed ? (
          <Link
            to="/dashboard"
            onClick={onNavigate}
            title="My workspace"
            className="flex size-11 items-center justify-center rounded-lg bg-[#212121] text-[#d9d9d9] transition hover:bg-[#2f2f2f] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label="Open My workspace"
          >
            <HardDrive className="size-5" aria-hidden="true" />
          </Link>
        ) : (
          <WorkspaceSwitcher onNavigate={onNavigate} />
        )}
      </div>

      <nav
        className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}
        aria-label="Dashboard navigation"
      >
        {navigationGroups.map((group) => (
          <div className={collapsed ? 'mb-4' : 'mb-6'} key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8e8e8e]">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isNavigationItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`flex min-h-10 items-center rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                      collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                    } ${
                      active
                        ? 'bg-[#2f2f2f] text-white'
                        : 'text-[#b4b4b4] hover:bg-[#2f2f2f] hover:text-[#ececec]'
                    }`}
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                    {active && !collapsed && (
                      <span
                        className="ml-auto size-1.5 rounded-full bg-[#d9d9d9]"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={`space-y-3 border-t border-white/5 ${
          collapsed ? 'p-3' : 'p-4'
        }`}
      >
        {!collapsed && (
          <Link
            to="/dashboard/storage"
            onClick={onNavigate}
            className="block rounded-lg bg-[#212121] p-3 transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-[#d9d9d9]">Storage</span>
              <span className="text-[#b4b4b4]">0 B of 5 GB</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#3a3a3a]">
              <div className="h-full w-0 rounded-full bg-[#b4b4b4]" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#8e8e8e]">
              <span>Free plan</span>
              <span>0% used</span>
            </div>
          </Link>
        )}

        <div
          className={`flex rounded-lg ${
            collapsed
              ? 'flex-col items-center gap-2 px-1 py-2'
              : 'items-center gap-3 px-2 py-2'
          }`}
        >
          <span
            title={collapsed ? displayName : undefined}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a] text-sm font-semibold text-[#ececec]"
          >
            {displayName.charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[#ececec]">
                {displayName}
              </span>
              <span className="block truncate text-xs text-[#8e8e8e]">
                {email}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              logout.mutate();
            }}
            disabled={logout.isPending}
            className="rounded-lg p-2 text-[#b4b4b4] transition hover:bg-[#3a3a3a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label="Log out"
          >
            {logout.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  open,
  onClose,
  pathname,
  displayName,
  email,
  collapsed,
  onToggleCollapsed,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  displayName: string;
  email?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/5 bg-[#171717] transition-[width] duration-300 lg:block ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 z-40 flex size-7 items-center justify-center rounded-full border border-white/10 bg-[#2f2f2f] text-[#c5c5c5] shadow-lg shadow-black/30 transition hover:bg-[#3a3a3a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </button>
        <SidebarContent
          pathname={pathname}
          displayName={displayName}
          email={email}
          collapsed={collapsed}
        />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#0d0d0d]/80 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close navigation"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="relative h-full w-[min(20rem,calc(100vw-2rem))] border-r border-white/5 bg-[#171717] shadow-2xl shadow-black"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-lg bg-[#3a3a3a] p-2 text-[#d9d9d9] hover:bg-[#4a4a4a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              aria-label="Close navigation"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <SidebarContent
              pathname={pathname}
              displayName={displayName}
              email={email}
              onNavigate={onClose}
              collapsed={false}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export function DashboardTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/5 bg-[#212121]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2.5 text-[#d9d9d9] hover:bg-[#2f2f2f] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#ececec]">
          Personal workspace
        </p>
        <p className="text-xs text-[#8e8e8e]">Owner</p>
      </div>

      <form
        className="mx-auto hidden w-full max-w-xl md:block"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="relative block">
          <span className="sr-only">Search files and folders</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8e8e8e]"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search files and folders"
            className="h-10 w-full rounded-full border border-white/10 bg-[#2f2f2f] pl-10 pr-16 text-sm text-[#ececec] outline-none placeholder:text-[#8e8e8e] focus:border-white/20 focus:ring-2 focus:ring-white/10"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-[#2f2f2f] px-1.5 py-0.5 text-[10px] text-[#8e8e8e]">
            Ctrl K
          </kbd>
        </label>
      </form>

      <button
        type="button"
        onClick={() => toast.info('You have no new notifications.')}
        className="ml-auto rounded-lg p-2.5 text-[#c5c5c5] transition hover:bg-[#2f2f2f] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 md:ml-0"
        aria-label="Notifications"
      >
        <Bell className="size-4" aria-hidden="true" />
      </button>
    </header>
  );
}
