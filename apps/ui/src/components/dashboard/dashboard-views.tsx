import { UploadButton, ItemActionsMenu, SharedView } from './file-features';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useBillingPortal, useBillingStatus, useCheckout } from '@/hooks/useBilling';
import {
  Building2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileUp,
  Folder,
  FolderPlus,
  Grid2X2,
  HardDrive,
  List,
  Plus,
  RotateCcw,
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
import {
  filesApi,
  type SharedEntry,
  type SharedFolder,
  type StoredFile,
  type StoredFolder,
} from '@/api/files.api';
import {
  useCreateFolder,
  useGetAllItems,
  useGetItems,
  useGetRecent,
  useGetSharedWithMe,
  useGetTrash,
  useRenameFolder,
  useRestoreTrashItem,
  useRecordRecent,
} from '@/hooks/useFiles';

const MAX_NESTING_DEPTH = 20;

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

const formatStoredSize = (size: string) => {
  const bytes = Number(size);
  return Number.isFinite(bytes) ? formatBytes(bytes) : size;
};

const isDirectChild = (
  parent: string | null | undefined,
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

type SharedFolderLocation = {
  folder: SharedFolder;
  trail: SharedFolder[];
  entry: SharedEntry;
};

const findSharedFolderLocation = (
  entries: SharedEntry[],
  folderId: string | undefined,
): SharedFolderLocation | undefined => {
  if (!folderId) return undefined;

  const visit = (
    folder: SharedFolder,
    entry: SharedEntry,
    trail: SharedFolder[],
  ): SharedFolderLocation | undefined => {
    const nextTrail = [...trail, folder];
    if (folder._id === folderId) return { folder, trail: nextTrail, entry };

    for (const child of folder.folders || []) {
      const match = visit(child, entry, nextTrail);
      if (match) return match;
    }

    return undefined;
  };

  for (const entry of entries) {
    if (entry.itemType !== 'folder') continue;
    const match = visit(entry.item as SharedFolder, entry, []);
    if (match) return match;
  }

  return undefined;
};

const withSharedMetadata = <T extends StoredFile | StoredFolder>(
  item: T,
  entry: SharedEntry,
): T => ({
  ...item,
  permissions: entry.permissions,
  sharedBy: entry.sharedBy,
  isShared: true,
});

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
    <div className="flex flex-col gap-5 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <HardDrive className="size-3.5" aria-hidden="true" />
          <span>Personal workspace</span>
          <span aria-hidden="true">/</span>
          <span className="text-zinc-300">{title}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function DriveView() {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const location = useLocation();
  const filesQuery = useGetAllItems();
  const sharedQuery = useGetSharedWithMe();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const recordRecent = useRecordRecent();

  const activeFolderId = location.pathname.match(
    /^\/dashboard\/folders\/([^/]+)\/?$/,
  )?.[1];
  const activeItemsQuery = useGetItems(activeFolderId);
  const allFiles = filesQuery.data?.[0] || [];
  const allFolders = filesQuery.data?.[1] || [];
  const sharedEntries = sharedQuery.data || [];
  const sharedFolderLocation = findSharedFolderLocation(
    sharedEntries,
    activeFolderId,
  );
  const currentOwnedFolder = allFolders.find(
    (folder) => folder._id === activeFolderId,
  );
  const currentFolder = currentOwnedFolder || sharedFolderLocation?.folder;
  const folderTrail = sharedFolderLocation
    ? sharedFolderLocation.trail
    : getFolderTrail(allFolders, activeFolderId);
  const decorateActiveItem = <T extends StoredFile | StoredFolder>(item: T) =>
    sharedFolderLocation
      ? withSharedMetadata(item, sharedFolderLocation.entry)
      : item;
  const files: StoredFile[] = activeFolderId
    ? (activeItemsQuery.data?.files || []).map(decorateActiveItem)
    : [
        ...allFiles.filter((file) => isDirectChild(file.parent, undefined)),
        ...sharedEntries
          .filter((entry) => entry.itemType === 'file')
          .map((entry) => withSharedMetadata(entry.item as StoredFile, entry)),
      ];
  const folders: StoredFolder[] = activeFolderId
    ? (activeItemsQuery.data?.folders || []).map(decorateActiveItem)
    : [
        ...allFolders.filter((folder) =>
          isDirectChild(folder.parent, undefined),
        ),
        ...sharedEntries
          .filter((entry) => entry.itemType === 'folder')
          .map((entry) =>
            withSharedMetadata(entry.item as SharedFolder, entry),
          ),
      ];
  const isSharedLocation = Boolean(sharedFolderLocation);
  const canCreateHere =
    !isSharedLocation ||
    sharedFolderLocation?.entry.permissions.includes('create') === true;
  const isLoadingFiles =
    filesQuery.isLoading ||
    (!activeFolderId && sharedQuery.isLoading) ||
    Boolean(activeFolderId && activeItemsQuery.isLoading);
  const hasFileQueryError =
    filesQuery.isError ||
    (!activeFolderId && sharedQuery.isError) ||
    Boolean(activeFolderId && activeItemsQuery.isError);
  const nestingLimitReached = folderTrail.length >= MAX_NESTING_DEPTH;

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
      />

      {nestingLimitReached && (
        <div
          role="status"
          className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs text-amber-100"
        >
          Maximum nesting depth reached. This level cannot contain additional
          files or folders.
        </div>
      )}

      <section
        className={`${panelClass} overflow-visible`}
        aria-labelledby="drive-browser-title"
      >
        <div className="flex flex-col gap-4 border-b border-zinc-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <nav
            className="flex items-center gap-1 text-sm"
            aria-label="Breadcrumb"
          >
            <Link to="/dashboard" className="text-zinc-200 hover:text-white">
              My Drive
            </Link>
            {folderTrail.length > 0 ? (
              folderTrail.map((folder, index) => (
                <span key={folder._id} className="flex items-center gap-1">
                  <ChevronRight
                    className="size-4 text-zinc-600"
                    aria-hidden="true"
                  />
                  {index === folderTrail.length - 1 ? (
                    <span className="text-zinc-400">{folder.name}</span>
                  ) : (
                    <Link
                      to={`/dashboard/folders/${folder._id}`}
                      className="text-zinc-200 hover:text-white"
                    >
                      {folder.name}
                    </Link>
                  )}
                </span>
              ))
            ) : (
              <>
                <ChevronRight
                  className="size-4 text-zinc-600"
                  aria-hidden="true"
                />
                <span className="text-zinc-500">All files</span>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <UploadButton
              parent={activeFolderId}
              destinationName={currentFolder?.name || 'My Drive'}
              disabled={!canCreateHere || nestingLimitReached}
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={
                createFolder.isPending || !canCreateHere || nestingLimitReached
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-xs font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-800"
            >
              <option value="name">Name</option>
              <option value="modified">Last modified</option>
              <option value="size">File size</option>
            </select>
            <div
              className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1"
              aria-label="View style"
            >
              <button
                type="button"
                onClick={() => setView('list')}
                className={`rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${view === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
                aria-label="List view"
                aria-pressed={view === 'list'}
              >
                <List className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${view === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
              >
                <Grid2X2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-zinc-800 bg-black/50 px-5 py-3">
          <div className="hidden grid-cols-[minmax(0,1fr)_120px_48px] gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600 sm:grid">
            <span id="drive-browser-title">Name</span>
            <span>Size</span>
            <span className="text-right">Actions</span>
          </div>
        </div>

        {isLoadingFiles ? (
          <div className="flex min-h-80 items-center justify-center text-sm text-zinc-500">
            Loading files...
          </div>
        ) : hasFileQueryError ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-zinc-300">Could not load your files.</p>
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
                : 'divide-y divide-zinc-800'
            }
          >
            {folders.map((folder) => (
              <FolderItem
                key={folder._id}
                folder={folder}
                view={view}
                href={`/dashboard/folders/${folder._id}`}
                canRename={!folder.isShared}
                sharedBy={folder.sharedBy}
                isRenaming={
                  !folder.isShared &&
                  renameFolder.isPending &&
                  renameFolder.variables?._id === folder._id
                }
                onRename={handleRenameFolder}
                onOpen={() =>
                  recordRecent.mutate({
                    itemId: folder._id,
                    itemType: 'folder',
                  })
                }
                actions={
                  <ItemActionsMenu
                    item={folder}
                    itemType="folder"
                    shared={folder.isShared}
                  />
                }
              />
            ))}
            {files.map((file) => (
              <article
                key={file._id}
                aria-label={`Open ${file.name}`}
                title={`Double-click to open ${file.name}`}
                tabIndex={0}
                onDoubleClick={() => {
                  recordRecent.mutate({
                    itemId: file._id,
                    itemType: 'file',
                  });
                  filesApi.openFile(file.url);
                }}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    event.key === 'Enter'
                  )
                    {
                      recordRecent.mutate({
                        itemId: file._id,
                        itemType: 'file',
                      });
                      filesApi.openFile(file.url);
                    }
                }}
                className={
                  view === 'grid'
                    ? 'relative cursor-pointer rounded-xl border border-zinc-800 bg-black p-4 transition hover:border-zinc-800 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400'
                    : 'grid cursor-pointer gap-2 px-5 py-4 transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:grid-cols-[minmax(0,1fr)_120px_48px] sm:items-center sm:gap-4'
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400">
                    <FileUp className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-medium text-zinc-100 ${view === 'grid' ? 'pr-10' : ''}`}
                    >
                      {file.name}
                    </p>
                    {file.sharedBy ? (
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        Shared by {file.sharedBy.name || file.sharedBy.email}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  {formatStoredSize(file.size)}
                </p>
                <ItemActionsMenu
                  item={file}
                  itemType="file"
                  shared={file.isShared}
                  className={view === 'grid' ? 'absolute right-3 top-3' : ''}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
            <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
              <FileUp className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-base font-medium text-zinc-100">
              Your drive is ready
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Files and folders returned by the backend will appear here.
            </p>
            <div className="mt-5">
              <UploadButton
                parent={activeFolderId}
                destinationName={currentFolder?.name || 'My Drive'}
                disabled={!canCreateHere || nestingLimitReached}
              />
            </div>
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
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-base font-medium text-zinc-100">
          Nothing here yet
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </section>
    </div>
  );
}

function RecentView() {
  const recent = useGetRecent();
  const recordRecent = useRecordRecent();
  const navigate = useNavigate();
  const items = recent.data || [];

  if (!recent.isLoading && !recent.isError && !items.length)
    return (
      <EmptyCollectionView
        title="Recent"
        description="Files and folders you open will be collected here for quick access."
        icon={Clock3}
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recent"
        description="Items are ordered by when you last opened them."
      />
      <section className={panelClass}>
        {recent.isLoading ? (
          <p className="p-6 text-sm text-zinc-400">Loading recent items&</p>
        ) : recent.isError ? (
          <p className="p-6 text-sm text-zinc-400">
            Could not load recent items.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {items.map((entry) => (
              <button
                key={entry._id}
                type="button"
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-zinc-900"
                onClick={() => {
                  recordRecent.mutate({
                    itemId: entry.item._id,
                    itemType: entry.itemType,
                  });
                  if (entry.itemType === 'folder')
                    navigate('/dashboard/folders/' + entry.item._id);
                  else filesApi.openFile((entry.item as StoredFile).url);
                }}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400">
                  {entry.itemType === 'folder' ? (
                    <Folder className="size-4" aria-hidden="true" />
                  ) : (
                    <FileUp className="size-4" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-100">
                    {entry.item.name}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    Opened {new Date(entry.openedAt).toLocaleString()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrashView() {
  const trash = useGetTrash();
  const restore = useRestoreTrashItem();
  const items = trash.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        description="Restore deleted files and folders back to your drive."
      />
      <section className={panelClass}>
        {items.length ? (
          <div className="divide-y divide-zinc-800">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-3 px-5 py-4"
              >
                <Trash2 className="size-4 text-zinc-500" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs capitalize text-zinc-500">
                    {item.trashType === 'shared-access'
                      ? 'Shared access'
                      : item.itemType}
                  </p>
                </div>
                <button
                  type="button"
                  className={secondaryButton}
                  disabled={restore.isPending}
                  onClick={() =>
                    restore.mutate(item._id, {
                      onSuccess: () => toast.success('Item restored.'),
                      onError: () => toast.error('Unable to restore item.'),
                    })
                  }
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
            <Trash2 className="mb-5 size-6 text-zinc-500" aria-hidden="true" />
            <h2 className="text-base font-medium text-zinc-100">
              Trash is empty
            </h2>
          </div>
        )}
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Personal workspace
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                0 B of 5 GB used
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                No active uploads or reserved storage.
              </p>
            </div>
            <span className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100">
              Free plan
            </span>
          </div>
          <div
            className="mt-7 h-2.5 overflow-hidden rounded-full bg-zinc-800"
            aria-label="0 percent of storage used"
          >
            <div className="h-full w-0 rounded-full bg-zinc-200" />
          </div>
          <div className="mt-3 flex justify-between text-xs text-zinc-500">
            <span>0% used</span>
            <span>5 GB available</span>
          </div>
        </div>
        <div className={`${panelClass} p-5 sm:p-6`}>
          <h2 className="text-sm font-medium text-zinc-100">Upload limits</h2>
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
                <dt className="text-zinc-500">{label}</dt>
                <dd className="font-medium text-zinc-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className={`${panelClass} p-5 sm:p-6`}>
        <h2 className="text-sm font-medium text-zinc-100">Storage breakdown</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {['Documents', 'Media', 'Other files'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-800 bg-black p-4"
            >
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-2 text-lg font-medium text-zinc-200">0 B</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const plans = [
  { id: 'free', name: 'Free', price: '$0', storage: '5 GB' },
  { id: 'pro', name: 'Pro', price: '$9', storage: '100 GB' },
  { id: 'ultra', name: 'Ultra', price: '$25', storage: '1 TB' },
] as const;

function BillingView() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const billingQuery = useBillingStatus(location.search.includes('checkout=success'));
  const checkout = useCheckout();
  const portal = useBillingPortal();
  const currentPlan = billingQuery.data?.plan ?? 'free';
  const hasSubscription = billingQuery.data?.subscription?.hasSubscription ?? false;
  const working = checkout.isPending || portal.isPending;

  useEffect(() => {
    if (billingQuery.data) {
      void queryClient.invalidateQueries({ queryKey: ['files', 'storage'] });
    }
  }, [billingQuery.data, queryClient]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your plan and payment preferences."
      />
      {location.search.includes('checkout=success') && currentPlan === 'free' && (
        <p className="text-sm text-zinc-300">
          Payment submitted. Waiting for Stripe to confirm your subscription.
        </p>
      )}
      {location.search.includes('checkout=cancel') && (
        <p className="text-sm text-zinc-300">Checkout was canceled. Your plan is unchanged.</p>
      )}
      {billingQuery.data && !billingQuery.data.billingReady && (
        <p className="text-sm text-amber-300">Configure the Stripe webhook signing secret to enable Checkout.</p>
      )}
      {billingQuery.isError && (
        <p className="text-sm text-red-300">Billing status is unavailable. Please reload.</p>
      )}
      {hasSubscription && (
        <button
          type="button"
          disabled={working}
          onClick={() => portal.mutate(undefined, {
            onSuccess: (url) => window.location.assign(url),
            onError: () => toast.error('Could not open the billing portal.'),
          })}
          className={secondaryButton}
        >
          Manage subscription
        </button>
      )}
      <section className="grid gap-4 lg:grid-cols-3" aria-label="Available plans">
        {plans.map((plan) => {
          const current = plan.id === currentPlan;
          return (
            <article
              key={plan.id}
              className={panelClass + ' flex flex-col p-5 sm:p-6' +
                (current ? ' ring-1 ring-zinc-400' : '')}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                {current && (
                  <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-200">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-5 text-3xl font-semibold text-white">
                {plan.price}
                <span className="text-sm font-normal text-zinc-500"> / month</span>
              </p>
              <p className="mt-5 text-sm text-zinc-300">{plan.storage} total storage</p>
              <button
                type="button"
                disabled={working || billingQuery.isPending || billingQuery.isError ||
                  !billingQuery.data?.billingReady ||
                  current || plan.id === 'free' || hasSubscription}
                onClick={() => {
                  if (plan.id === 'pro' || plan.id === 'ultra') {
                    checkout.mutate(plan.id, {
                      onSuccess: (url) => window.location.assign(url),
                      onError: () => toast.error('Could not start Stripe Checkout.'),
                    });
                  }
                }}
                className={(current ? secondaryButton : primaryButton) + ' mt-6 w-full'}
              >
                {current ? 'Current plan' :
                  hasSubscription ? 'Manage in billing portal' : 'Choose ' + plan.name}
              </button>
            </article>
          );
        })}
      </section>
      <p className="text-xs text-zinc-500">
        Checkout is completed on Stripe. Storage changes after its signed webhook confirms payment.
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
          <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
            <Building2 className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium text-zinc-100">
            No organizations yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
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
            <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-medium text-zinc-100">
                Role boundaries
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Access applies only inside the active organization.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {roles.map(([role, description]) => (
              <div
                key={role}
                className="rounded-xl border border-zinc-800 bg-black p-4"
              >
                <p className="text-sm font-medium text-zinc-200">{role}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
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
          <h2 className="text-sm font-medium text-zinc-100">
            Drive preferences
          </h2>
          <div className="mt-5 space-y-4">
            {[
              ['Default view', 'List'],
              ['Upload conflict', 'Ask before replacing'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 last:border-0 last:pb-0"
              >
                <span className="text-sm text-zinc-500">{label}</span>
                <button
                  type="button"
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  {value}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={`${panelClass} p-5 sm:p-6`}>
          <h2 className="text-sm font-medium text-zinc-100">Security</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
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
            className="rounded-2xl border border-zinc-800 bg-black p-5 text-left transition hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <CircleHelp className="size-5 text-zinc-400" aria-hidden="true" />
            <span className="mt-5 block text-sm font-medium text-zinc-100">
              {title}
            </span>
            <span className="mt-2 block text-xs leading-5 text-zinc-500">
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
      return (
        <SharedView
          header={
            <PageHeader
              title="Shared with me"
              description="Files and folders shared with your account."
            />
          }
        />
      );
    case 'recent':
      return <RecentView />;
    case 'trash':
      return <TrashView />;
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
