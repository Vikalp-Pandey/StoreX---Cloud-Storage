import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useAuth';
import { sectionDetails } from '@/components/dashboard/dashboard-config';
import {
  DashboardSidebar,
  DashboardTopBar,
} from '@/components/dashboard/dashboard-shell';
import { DashboardSection } from '@/components/dashboard/dashboard-views';

const SIDEBAR_STORAGE_KEY = 'storex:dashboard-sidebar-collapsed';

export default function DashboardPage() {
  const { data: userData, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true',
  );
  const user = userData?.data?.user as
    | { name?: string; email?: string }
    | undefined;
  const sectionSegment = location.pathname.split('/')[2] || 'drive';
  const section = sectionDetails[sectionSegment] ? sectionSegment : 'drive';
  const displayName = user?.name || user?.email?.split('@')[0] || 'StoreX user';
  const closeMobileNavigation = useCallback(
    () => setMobileNavigationOpen(false),
    [],
  );
  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((collapsed) => !collapsed),
    [],
  );

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, navigate, user]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black text-zinc-400">
        <Loader2
          className="size-8 animate-spin text-zinc-100"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm">Checking your StoreX session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <DashboardSidebar
        open={mobileNavigationOpen}
        onClose={closeMobileNavigation}
        pathname={location.pathname}
        displayName={displayName}
        email={user.email}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
      />

      <div
        className={`transition-[padding] duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        <DashboardTopBar onOpenMenu={() => setMobileNavigationOpen(true)} />
        <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-[1600px]">
            <DashboardSection section={section} />
          </div>
        </main>
      </div>
    </div>
  );
}
