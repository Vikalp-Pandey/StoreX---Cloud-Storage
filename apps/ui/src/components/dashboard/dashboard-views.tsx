import {
  UploadButton,
  ShareButton,
  FileActions,
  SharedView,
} from './file-features';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Building2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  FileUp,
  Folder,
  FolderPlus,
  Grid2X2,
  HardDrive,
  List,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import {
  panelClass,
  primaryButton,
  secondaryButton,
} from '@/components/dashboard/dashboard-config';
import { FolderItem } from '@/components/dashboard/folder-item';
import type { StoredFolder } from '@/api/files.api';
import {
  useCreateFolder,
  useGetAllItems,
  useRenameFolder,
} from '@/hooks/useFiles';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return (
    (bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1) +
    ' ' +
    units[unitIndex]
  );
};

const getStoredSizeInBytes = (size: string) => {
  const bytes = Number(size);
  return Number.isFinite(bytes) ? bytes : 0;
};

const formatStoredSize = (size: string) => {
  const bytes = Number(size);
  return Number.isFinite(bytes) ? formatBytes(bytes) : size;
};

const isDirectChild = (
  parent: string | undefined,
  activeFolderId: string | undefined,
) => (activeFolderId ? parent === activeFolderId : !parent);

const getFolderTrail = (
  folders: StoredFolder[],
  activeFolderId: string | undefined,
) => {
  if (!activeFolderId) return [];

  const foldersById = new Map(folders.map((folder) => [folder._id, folder]));
  const trail: StoredFolder[] = [];
  const visited = new Set<string>();
  let folder = foldersById.get(activeFolderId);

  while (folder && !visited.has(folder._id)) {
    trail.unshift(folder);
    visited.add(folder._id);
    folder = folder.parent ? foldersById.get(folder.parent) : undefined;
  }

  return trail;
};

function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-white/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-[#8e8e8e]">
          <HardDrive className="size-3.5" aria-hidden="true" />
          <span>Personal workspace</span>
          <span aria-hidden="true">/</span>
          <span className="text-[#c5c5c5]">{title}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b4b4b4]">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <div className={`${panelClass} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#8e8e8e]">{label}</p>
          <p className="mt-2 text-xl font-semibold text-[#ececec]">{value}</p>
          <p className="mt-1 text-xs text-[#8e8e8e]">{hint}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#2f2f2f] text-[#b4b4b4]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function DriveView() {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const location = useLocation();
  const filesQuery = useGetAllItems();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const activeFolderId = location.pathname.match(
    /^\/dashboard\/folders\/([^/]+)\/?$/,
  )?.[1];
  const allFiles = filesQuery.data?.[0] || [];
  const allFolders = filesQuery.data?.[1] || [];
  const files = allFiles.filter((file) =>
    isDirectChild(file.parent, activeFolderId),
  );
  const folders = allFolders.filter((folder) =>
    isDirectChild(folder.parent, activeFolderId),
  );
  const currentFolder = allFolders.find(
    (folder) => folder._id === activeFolderId,
  );
  const folderTrail = getFolderTrail(allFolders, activeFolderId);
  const isLoadingFiles = filesQuery.isLoading;
  const usedBytes = files.reduce(
    (total, file) => total + getStoredSizeInBytes(file.size),
    0,
  );

  const handleCreateFolder = () => {
    const folderNumber = folders.length + 1;
    const name =
      folderNumber === 1 ? 'New folder' : `New folder ${folderNumber}`;

    createFolder.mutate(
      {
        ...(activeFolderId ? { parent: activeFolderId } : {}),
        name,
        size: '0',
      },
      {
        onSuccess: () => {
          toast.success(`${name} created successfully.`);
        },
        onError: () => {
          toast.error('Could not create the folder.');
        },
      },
    );
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    try {
      await renameFolder.mutateAsync({ _id: folderId, name });
      toast.success(`Folder renamed to ${name}.`);
    } catch {
      toast.error('Could not rename the folder.');
      throw new Error('Folder rename failed.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentFolder?.name || 'My Drive'}
        description={
          currentFolder
            ? 'View and manage this folder’s direct children.'
            : 'View and manage files in your personal workspace.'
        }
        actions={<UploadButton parent={activeFolderId} />}
      />

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Workspace summary"
      >
        <StatCard
          label="Storage used"
          value={formatBytes(usedBytes)}
          hint="Files in this folder"
          icon={HardDrive}
        />
        <StatCard
          label="Items"
          value={(files.length + folders.length).toString()}
          hint="Files and folders"
          icon={Folder}
        />
        <StatCard
          label="Current plan"
          value="Free"
          hint="100 MB per file"
          icon={CreditCard}
        />
      </section>

      <section
        className={`${panelClass} overflow-hidden`}
        aria-labelledby="drive-browser-title"
      >
        <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <nav
            className="flex items-center gap-1 text-sm"
            aria-label="Breadcrumb"
          >
            <Link to="/dashboard" className="text-[#d9d9d9] hover:text-white">
              My Drive
            </Link>
            {folderTrail.length > 0 ? (
              folderTrail.map((folder, index) => (
                <span key={folder._id} className="flex items-center gap-1">
                  <ChevronRight
                    className="size-4 text-[#676767]"
                    aria-hidden="true"
                  />
                  {index === folderTrail.length - 1 ? (
                    <span className="text-[#b4b4b4]">{folder.name}</span>
                  ) : (
                    <Link
                      to={`/dashboard/folders/${folder._id}`}
                      className="text-[#d9d9d9] hover:text-white"
                    >
                      {folder.name}
                    </Link>
                  )}
                </span>
              ))
            ) : (
              <>
                <ChevronRight
                  className="size-4 text-[#676767]"
                  aria-hidden="true"
                />
                <span className="text-[#8e8e8e]">All files</span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={createFolder.isPending}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#3a3a3a] px-3 text-xs font-medium text-[#ececec] transition hover:border-white/20 hover:bg-[#4a4a4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FolderPlus className="size-4" aria-hidden="true" />
              {createFolder.isPending ? 'Creating...' : 'New folder'}
            </button>
            <label className="sr-only" htmlFor="drive-sort">
              Sort files
            </label>
            <select
              id="drive-sort"
              defaultValue="name"
              className="h-9 rounded-lg border border-white/10 bg-[#2f2f2f] px-3 text-xs text-[#d9d9d9] outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10"
            >
              <option value="name">Name</option>
              <option value="modified">Last modified</option>
              <option value="size">File size</option>
            </select>
            <div
              className="flex rounded-lg border border-white/10 bg-[#2f2f2f] p-1"
              aria-label="View style"
            >
              <button
                type="button"
                onClick={() => setView('list')}
                className={`rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${view === 'list' ? 'bg-[#4a4a4a] text-white' : 'text-[#8e8e8e] hover:text-[#d9d9d9]'}`}
                aria-label="List view"
                aria-pressed={view === 'list'}
              >
                <List className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${view === 'grid' ? 'bg-[#4a4a4a] text-white' : 'text-[#8e8e8e] hover:text-[#d9d9d9]'}`}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
              >
                <Grid2X2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-white/5 bg-[#212121]/50 px-5 py-3">
          <div className="hidden grid-cols-[minmax(0,1fr)_160px_120px] gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#676767] sm:grid">
            <span id="drive-browser-title">Name</span>
            <span>Actions</span>
            <span>Size</span>
          </div>
        </div>

        {isLoadingFiles ? (
          <div className="flex min-h-80 items-center justify-center text-sm text-[#8e8e8e]">
            Loading files...
          </div>
        ) : filesQuery.isError ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-[#c5c5c5]">Could not load your files.</p>
            <button
              type="button"
              className={`${secondaryButton} mt-4`}
              onClick={() => filesQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : files.length + folders.length > 0 ? (
          <div
            className={
              view === 'grid'
                ? 'grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'divide-y divide-white/5'
            }
          >
            {folders.map((folder) => (
              <FolderItem
                key={folder._id}
                folder={folder}
                view={view}
                href={`/dashboard/folders/${folder._id}`}
                isRenaming={
                  renameFolder.isPending &&
                  renameFolder.variables?._id === folder._id
                }
                onRename={handleRenameFolder}
                actions={<ShareButton item={folder} itemType="folder" />}
              />
            ))}
            {files.map((file) => (
              <article
                key={file._id}
                aria-label={`Open ${file.name}`}
                className={
                  view === 'grid'
                    ? 'cursor-pointer rounded-xl border border-white/5 bg-[#212121] p-4 transition hover:border-white/10 hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25'
                    : 'grid cursor-pointer gap-2 px-5 py-4 transition hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/25 sm:grid-cols-[minmax(0,1fr)_160px_120px] sm:items-center sm:gap-4'
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#2f2f2f] text-[#b4b4b4]">
                    <FileUp className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#ececec]">
                      {file.name}
                    </p>
                    {view === 'grid' && (
                      <p className="mt-1 truncate text-xs text-[#8e8e8e]">
                        {file.name}
                      </p>
                    )}
                  </div>
                </div>
                <FileActions file={file} />
                <p className="text-xs text-[#b4b4b4]">
                  {formatStoredSize(file.size)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
            <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-[#2f2f2f] text-[#b4b4b4]">
              <FileUp className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-base font-medium text-[#ececec]">
              Your drive is ready
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#8e8e8e]">
              Files and folders returned by the backend will appear here.
            </p>
            <UploadButton parent={activeFolderId} />
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyCollectionView({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <section
        className={`${panelClass} flex min-h-96 flex-col items-center justify-center px-6 py-14 text-center`}
      >
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#2f2f2f] text-[#b4b4b4]">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-base font-medium text-[#ececec]">
          Nothing here yet
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#8e8e8e]">
          {description}
        </p>
      </section>
    </div>
  );
}

function StorageView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage"
        description="Review usage, upload limits, and storage allocation."
        actions={
          <Link to="/dashboard/billing" className={primaryButton}>
            Upgrade plan
          </Link>
        }
      />
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8e8e8e]">
                Personal workspace
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                0 B of 5 GB used
              </h2>
              <p className="mt-2 text-sm text-[#8e8e8e]">
                No active uploads or reserved storage.
              </p>
            </div>
            <span className="rounded-lg border border-white/15 bg-[#3a3a3a] px-3 py-1.5 text-xs font-medium text-[#ececec]">
              Free plan
            </span>
          </div>
          <div
            className="mt-7 h-2.5 overflow-hidden rounded-full bg-[#3a3a3a]"
            aria-label="0 percent of storage used"
          >
            <div className="h-full w-0 rounded-full bg-[#d9d9d9]" />
          </div>
          <div className="mt-3 flex justify-between text-xs text-[#8e8e8e]">
            <span>0% used</span>
            <span>5 GB available</span>
          </div>
        </div>
        <div className={`${panelClass} p-5 sm:p-6`}>
          <h2 className="text-sm font-medium text-[#ececec]">Upload limits</h2>
          <dl className="mt-5 space-y-4 text-sm">
            {[
              ['Maximum file size', '100 MB'],
              ['Reserved storage', '0 B'],
              ['Upload status', 'Available'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4"
              >
                <dt className="text-[#8e8e8e]">{label}</dt>
                <dd className="font-medium text-[#d9d9d9]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className={`${panelClass} p-5 sm:p-6`}>
        <h2 className="text-sm font-medium text-[#ececec]">
          Storage breakdown
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {['Documents', 'Media', 'Other files'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-white/5 bg-[#212121] p-4"
            >
              <p className="text-xs text-[#8e8e8e]">{label}</p>
              <p className="mt-2 text-lg font-medium text-[#d9d9d9]">0 B</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    storage: '5 GB',
    fileLimit: '100 MB',
    current: true,
  },
  {
    name: 'Pro',
    price: '$9',
    storage: '100 GB',
    fileLimit: '2 GB',
    current: false,
  },
  {
    name: 'Ultra',
    price: '$25',
    storage: '1 TB',
    fileLimit: '10 GB',
    current: false,
  },
];

function BillingView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your plan, invoices, and payment preferences."
      />
      <section
        className="grid gap-4 lg:grid-cols-3"
        aria-label="Available plans"
      >
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`${panelClass} flex flex-col p-5 sm:p-6 ${plan.current ? 'ring-1 ring-white/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
              {plan.current && (
                <span className="rounded-md bg-[#3a3a3a] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d9d9d9]">
                  Current
                </span>
              )}
            </div>
            <p className="mt-5 text-3xl font-semibold text-white">
              {plan.price}
              <span className="text-sm font-normal text-[#8e8e8e]">
                {' '}
                / month
              </span>
            </p>
            <dl className="mt-6 space-y-3 border-t border-white/5 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#8e8e8e]">Storage</dt>
                <dd className="text-[#d9d9d9]">{plan.storage}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8e8e8e]">Per-file limit</dt>
                <dd className="text-[#d9d9d9]">{plan.fileLimit}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8e8e8e]">File preview</dt>
                <dd className="text-[#d9d9d9]">Included</dd>
              </div>
            </dl>
            <button
              type="button"
              disabled={plan.current}
              onClick={() =>
                toast.info(
                  `${plan.name} checkout will be enabled with Stripe billing.`,
                )
              }
              className={`${plan.current ? secondaryButton : primaryButton} mt-6 w-full`}
            >
              {plan.current ? 'Current plan' : `Choose ${plan.name}`}
            </button>
          </article>
        ))}
      </section>
      <p className="text-xs leading-5 text-[#676767]">
        Plan prices and limits are proposed MVP defaults and remain subject to
        product and finance approval.
      </p>
    </div>
  );
}

function OrganizationsView() {
  const roles = [
    ['Admin', 'Manage members, settings, and all workspace content.'],
    ['Developer', 'Create, edit, move, download, and preview content.'],
    ['Viewer', 'View, search, download, and preview content only.'],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Create isolated workspaces and manage organization roles."
        actions={
          <button
            type="button"
            className={primaryButton}
            onClick={() =>
              toast.info(
                'Organization creation will be enabled when its API is connected.',
              )
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Create organization
          </button>
        }
      />
      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div
          className={`${panelClass} flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center`}
        >
          <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#2f2f2f] text-[#b4b4b4]">
            <Building2 className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium text-[#ececec]">
            No organizations yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#8e8e8e]">
            Create an organization to get an isolated workspace with its own
            files, storage, billing, and members.
          </p>
          <button
            type="button"
            className={`${secondaryButton} mt-5`}
            onClick={() =>
              toast.info('Organization creation requires the organization API.')
            }
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Start an organization
          </button>
        </div>
        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#2f2f2f] text-[#b4b4b4]">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-medium text-[#ececec]">
                Role boundaries
              </h2>
              <p className="mt-1 text-xs text-[#8e8e8e]">
                Access applies only inside the active organization.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {roles.map(([role, description]) => (
              <div
                key={role}
                className="rounded-xl border border-white/5 bg-[#212121] p-4"
              >
                <p className="text-sm font-medium text-[#d9d9d9]">{role}</p>
                <p className="mt-1 text-xs leading-5 text-[#8e8e8e]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Control workspace defaults and account preferences."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${panelClass} p-5 sm:p-6`}>
          <h2 className="text-sm font-medium text-[#ececec]">
            Drive preferences
          </h2>
          <div className="mt-5 space-y-4">
            {[
              ['Default view', 'List'],
              ['Upload conflict', 'Ask before replacing'],
              ['Trash retention', '30 days'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
              >
                <span className="text-sm text-[#8e8e8e]">{label}</span>
                <button
                  type="button"
                  className="rounded-lg bg-[#3a3a3a] px-3 py-2 text-xs text-[#d9d9d9] hover:bg-[#4a4a4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  {value}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={`${panelClass} p-5 sm:p-6`}>
          <h2 className="text-sm font-medium text-[#ececec]">Security</h2>
          <p className="mt-2 text-sm leading-6 text-[#8e8e8e]">
            Authentication and session controls protect every personal or
            organization workspace.
          </p>
          <button
            type="button"
            className={`${secondaryButton} mt-5`}
            onClick={() =>
              toast.info(
                'Security settings are not available in this UI milestone.',
              )
            }
          >
            Review security
          </button>
        </div>
      </section>
    </div>
  );
}

function HelpView() {
  const topics = [
    [
      'Files and folders',
      'Learn how uploads, organization, Trash, and previews work.',
    ],
    [
      'Plans and storage',
      'Understand quotas, per-file limits, and plan changes.',
    ],
    ['Organizations', 'Review role permissions and workspace isolation.'],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help"
        description="Find guidance for files, billing, and organizations."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {topics.map(([title, description]) => (
          <button
            type="button"
            key={title}
            onClick={() =>
              toast.info(
                `${title} documentation will be added to the help center.`,
              )
            }
            className="rounded-2xl border border-white/10 bg-[#212121] p-5 text-left transition hover:border-white/15 hover:bg-[#2f2f2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <CircleHelp className="size-5 text-[#b4b4b4]" aria-hidden="true" />
            <span className="mt-5 block text-sm font-medium text-[#ececec]">
              {title}
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#8e8e8e]">
              {description}
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}

export function DashboardSection({ section }: { section: string }) {
  switch (section) {
    case 'shared':
      return <SharedView />;
    case 'recent':
      return (
        <EmptyCollectionView
          title="Recent"
          description="Files and folders you open will be collected here for quick access."
          icon={Clock3}
        />
      );
    case 'trash':
      return (
        <EmptyCollectionView
          title="Trash"
          description="Deleted items will stay here for 30 days before permanent removal."
          icon={Trash2}
        />
      );
    case 'storage':
      return <StorageView />;
    case 'billing':
      return <BillingView />;
    case 'organizations':
      return <OrganizationsView />;
    case 'settings':
      return <SettingsView />;
    case 'help':
      return <HelpView />;
    default:
      return <DriveView />;
  }
}
