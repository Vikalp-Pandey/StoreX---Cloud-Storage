import {
  Building2,
  CircleHelp,
  Clock3,
  CreditCard,
  Folder,
  HardDrive,
  Settings,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

export const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#f4f4f4] px-4 text-sm font-medium text-[#0d0d0d] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-45';

export const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#2f2f2f] px-4 text-sm font-medium text-[#ececec] transition hover:bg-[#3a3a3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-45';

export const panelClass =
  'rounded-2xl border border-white/10 bg-[#262626] shadow-sm shadow-black/10';

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'My Drive', href: '/dashboard', icon: Folder },
      { label: 'Shared with me', href: '/dashboard/shared', icon: Folder },
      { label: 'Recent', href: '/dashboard/recent', icon: Clock3 },
      { label: 'Trash', href: '/dashboard/trash', icon: Trash2 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Storage', href: '/dashboard/storage', icon: HardDrive },
      { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
      {
        label: 'Organizations',
        href: '/dashboard/organizations',
        icon: Building2,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Help', href: '/dashboard/help', icon: CircleHelp },
    ],
  },
];

export const sectionDetails: Record<
  string,
  { title: string; description: string }
> = {
  drive: {
    title: 'My Drive',
    description:
      'Upload, organize, and manage files in your personal workspace.',
  },
  shared: {
    title: 'Shared with me',
    description: 'Files and folders shared with your account.',
  },
  recent: {
    title: 'Recent',
    description: 'Return to the files and folders you opened most recently.',
  },
  trash: {
    title: 'Trash',
    description: 'Restore deleted items or remove them permanently.',
  },
  storage: {
    title: 'Storage',
    description: 'Review usage, upload limits, and storage allocation.',
  },
  billing: {
    title: 'Billing',
    description: 'Manage your plan, invoices, and payment preferences.',
  },
  organizations: {
    title: 'Organizations',
    description: 'Create isolated workspaces and manage organization roles.',
  },
  settings: {
    title: 'Settings',
    description: 'Control workspace defaults and account preferences.',
  },
  help: {
    title: 'Help',
    description: 'Find guidance for files, billing, and organizations.',
  },
};

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return (
      pathname === '/dashboard' ||
      pathname === '/dashboard/' ||
      pathname.startsWith('/dashboard/folders/')
    );
  }

  return pathname.startsWith(href);
}
