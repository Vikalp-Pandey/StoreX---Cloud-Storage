import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Upload,
  Download,
  Share2,
  X,
  FileText,
  Folder,
  Users,
  Eye,
  FolderPlus,
  Trash2,
  Loader2,
  Send,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  filesApi,
  type Permission,
  type StoredFile,
  type StoredFolder,
  type SharedFolder,
  type SharedEntry,
} from '@/api/files.api';
import { primaryButton, secondaryButton, panelClass } from './dashboard-config';
import { useRecordRecent } from '@/hooks/useFiles';

const iconButton = `${secondaryButton.replace('px-4', 'px-0')} size-10 shrink-0`;
const permissionIcons = { read: Eye, create: FolderPlus, delete: Trash2 };

function message(error: unknown) {
  if (axios.isAxiosError(error))
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message
    );
  return error instanceof Error ? error.message : 'The operation failed.';
}

export function UploadButton({
  parent,
  destinationName = 'My Drive',
  disabled = false,
}: {
  parent?: string;
  destinationName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-zinc-700 px-3.5 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-45"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? 'Maximum nesting depth reached' : 'Upload a file'}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Upload className="size-4" aria-hidden="true" />
        Upload file
      </button>
      {open && (
        <UploadDialog
          parent={parent}
          destinationName={destinationName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function UploadDialog({
  parent,
  destinationName,
  onClose,
}: {
  parent?: string;
  destinationName: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();
  const upload = useMutation({
    mutationFn: () =>
      filesApi.upload({ file: file!, parent, onProgress: setProgress }),
    onSuccess: () => {
      setFile(null);
      setProgress(0);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File uploaded.');
      dialog.current?.close();
    },
    onError: (error) => toast.error(message(error)),
  });

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const chooseFile = (nextFile?: File) => {
    if (!nextFile || upload.isPending) return;
    setFile(nextFile);
    setProgress(0);
  };

  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        if (upload.isPending) event.preventDefault();
      }}
      onClose={onClose}
      aria-labelledby="upload-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-6">
        <div>
          <h2 id="upload-title" className="text-lg font-semibold">
            Upload a file
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Add it directly to {destinationName}.
          </p>
        </div>
        <button
          type="button"
          className={iconButton}
          onClick={() => dialog.current?.close()}
          disabled={upload.isPending}
          aria-label="Close upload dialog"
          title="Close"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <input
          ref={input}
          type="file"
          className="sr-only"
          aria-label="Choose a file to upload"
          disabled={upload.isPending}
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        <button
          type="button"
          className={`flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
            isDragging
              ? 'border-zinc-600 bg-zinc-800'
              : 'border-zinc-700 bg-black hover:border-zinc-600 hover:bg-zinc-900'
          }`}
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-200">
            {file ? (
              <FileText className="size-5" aria-hidden="true" />
            ) : (
              <Upload className="size-5" aria-hidden="true" />
            )}
          </span>
          {file ? (
            <>
              <span className="max-w-full truncate text-sm font-medium text-zinc-100">
                {file.name}
              </span>
              <span className="mt-1 text-xs text-zinc-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB · Click to choose
                another file
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-zinc-100">
                Drop your file here
              </span>
              <span className="mt-1 text-xs text-zinc-500">
                or click to browse your computer
              </span>
            </>
          )}
        </button>

        {upload.isPending && (
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={secondaryButton}
            onClick={() => dialog.current?.close()}
            disabled={upload.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            disabled={!file || upload.isPending}
            onClick={() => {
              setProgress(0);
              upload.mutate();
            }}
          >
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {upload.isPending ? 'Uploading…' : 'Upload file'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function ItemActionsMenu({
  item,
  itemType,
  shared = false,
  className,
}: {
  item: StoredFile | StoredFolder;
  itemType: 'file' | 'folder';
  shared?: boolean;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const file = itemType === 'file' ? (item as StoredFile) : undefined;
  const canDownload = !!file && (!shared || item.permissions?.includes('read'));
  const canShare = !shared;
  const canDelete = !shared || item.permissions?.includes('delete') === true;
  const download = useMutation({
    mutationFn: () => filesApi.download(file!.url, file!.name),
    onSuccess: () => setMenuOpen(false),
    onError: (error) => toast.error(message(error)),
  });
  const remove = useMutation({
    mutationFn: () =>
      itemType === 'file'
        ? filesApi.deleteFile(item._id)
        : filesApi.deleteFolder(item._id),
    onSuccess: () => {
      setMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success(`${itemType === 'file' ? 'File' : 'Folder'} deleted.`);
    },
    onError: (error) => toast.error(message(error)),
  });

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const menuItemClass =
    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <>
      <div
        ref={menu}
        className={`z-20 ml-auto flex justify-end ${className || 'relative'}`}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-semibold tracking-[0.08em] text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          title={`Actions for ${item.name}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={`Actions for ${item.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span aria-hidden="true">...</span>
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-11 z-30 min-w-36 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl"
          >
            {canDownload && (
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                disabled={download.isPending}
                onClick={() => download.mutate()}
              >
                <Download className="size-3.5 shrink-0" aria-hidden="true" />
                {download.isPending ? 'Downloading…' : 'Download'}
              </button>
            )}
            {canShare && (
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => {
                  setMenuOpen(false);
                  setShareOpen(true);
                }}
              >
                <Share2 className="size-3.5 shrink-0" aria-hidden="true" />
                Share
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClass} text-red-300 hover:text-red-200`}
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Delete ${item.name}?`)) remove.mutate();
                }}
              >
                {remove.isPending ? (
                  <Loader2
                    className="size-3.5 shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        )}
      </div>
      {shareOpen && (
        <ShareDialog
          item={item}
          itemType={itemType}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
function ShareDialog({
  item,
  itemType,
  onClose,
}: {
  item: StoredFile | StoredFolder;
  itemType: 'file' | 'folder';
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>(['read']);
  const queryClient = useQueryClient();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(email.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [email]);
  const users = useQuery({
    queryKey: ['files', 'search-users', search],
    queryFn: () => filesApi.searchUsers(search),
    enabled: !!search,
  });
  const shares = useQuery({
    queryKey: ['files', 'shares', item._id, itemType],
    queryFn: () => filesApi.sharesForItem(item._id, itemType),
  });
  const share = useMutation({
    mutationFn: () =>
      filesApi.shareItems({ itemId: item._id, itemType, email, permissions }),
    onSuccess: () => {
      toast.success('Item shared successfully.');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error) => toast.error(message(error)),
  });
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="share-title"
      className="m-auto w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-white backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="share-title"
          className="flex min-w-0 items-center gap-2 text-lg"
        >
          <Share2
            className="size-5 shrink-0 text-zinc-400"
            aria-hidden="true"
          />
          <span className="truncate">Share {item.name}</span>
        </h2>
        <button
          className={iconButton}
          onClick={onClose}
          aria-label="Close sharing dialog"
          title="Close"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          share.mutate();
        }}
      >
        <label className="block text-sm">
          Recipient email
          <input
            autoFocus
            required
            type="email"
            list="share-users"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-600 bg-black p-3"
          />
        </label>
        <datalist id="share-users">
          {users.data?.map((user) => (
            <option key={user._id} value={user.email}>
              {user.name}
            </option>
          ))}
        </datalist>
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-2 text-sm">Permissions</legend>
          {(itemType === 'folder'
            ? (['read', 'create', 'delete'] as Permission[])
            : (['read', 'delete'] as Permission[])
          ).map((permission) => {
            const Icon = permissionIcons[permission];
            return (
              <label
                key={permission}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(permission)}
                  onChange={(event) =>
                    setPermissions((current) =>
                      event.target.checked
                        ? [...current, permission]
                        : current.filter((value) => value !== permission),
                    )
                  }
                />
                <Icon className="size-4 text-zinc-400" aria-hidden="true" />
                {permission}
              </label>
            );
          })}
        </fieldset>
        <p className="text-xs text-zinc-400">
          Share with an existing StoreX account. Folder permissions are
          inherited by existing and future descendants through OpenFGA.
        </p>
        <button
          className={primaryButton}
          disabled={share.isPending || !permissions.length}
        >
          {share.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {share.isPending ? 'Sharing…' : 'Share'}
        </button>
      </form>
      <h3 className="mt-6 flex items-center gap-2 font-medium">
        <Users className="size-4 text-zinc-400" aria-hidden="true" />
        People with access
      </h3>
      {shares.isLoading ? (
        <p role="status">Loading…</p>
      ) : shares.isError ? (
        <p>Could not load sharing.</p>
      ) : !shares.data?.length ? (
        <p className="mt-3 text-sm">No shares yet.</p>
      ) : (
        shares.data.map((record) => (
          <div key={record._id} className="mt-3 border-t border-zinc-800 pt-3">
            <p className="break-all text-sm">
              {record.recipient?.email || 'Deleted account'}
              <span className="block text-xs text-zinc-400">
                {record.permissions.join(', ')}
              </span>
            </p>
          </div>
        ))
      )}
    </dialog>
  );
}

export function SharedView({ header }: { header?: ReactNode }) {
  const [trail, setTrail] = useState<SharedEntry[]>([]);
  const recordRecent = useRecordRecent();
  const current = trail[trail.length - 1];
  const root = useQuery({
    queryKey: ['files', 'shared'],
    queryFn: filesApi.sharedWithMe,
  });
  const folder = current?.item as SharedFolder | undefined;
  const entries: SharedEntry[] = current
    ? [
        ...(folder?.folders || []).map((item) => ({
          ...current,
          item,
          itemType: 'folder' as const,
        })),
        ...(folder?.files || []).map((item) => ({
          ...current,
          item,
          itemType: 'file' as const,
        })),
      ]
    : root.data || [];
  const openEntry = (entry: SharedEntry) => {
    if (!entry.permissions.includes('read')) {
      toast.error('Read permission is required to open this item.');
      return;
    }

    recordRecent.mutate({
      itemId: entry.item._id,
      itemType: entry.itemType,
    });
    if (entry.itemType === 'folder') {
      setTrail([...trail, entry]);
      return;
    }

    filesApi.openFile((entry.item as StoredFile).url);
  };
  return (
    <div className="space-y-5">
      {header}
      {(trail.length > 0 || Boolean(root.data?.length)) && (
        <div className="flex flex-wrap gap-3">
          <button
            className={iconButton}
            onClick={() => setTrail([])}
            aria-label="All shared items"
            title="All shared items"
          >
            <Users className="size-4" aria-hidden="true" />
          </button>
          {trail.map((entry, index) => (
            <button
              key={entry.item._id}
              className={secondaryButton}
              onClick={() => setTrail(trail.slice(0, index + 1))}
            >
              <Folder className="size-4 shrink-0" aria-hidden="true" />
              {entry.item.name}
            </button>
          ))}
        </div>
      )}
      {root.isLoading ? (
        <p role="status">Loading shared items…</p>
      ) : root.isError ? (
        <p>Could not load shared items.</p>
      ) : !entries.length ? (
        <section
          className={panelClass + ' flex min-h-96 flex-col items-center justify-center px-6 py-14 text-center'}
        >
          <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
            <Users className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium text-zinc-100">
            Nothing shared with you yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Files and folders shared with your account will appear here.
          </p>
        </section>
      ) : (
        entries.map((entry) => (
          <article
            key={entry.item._id}
            className={`${panelClass} flex cursor-pointer flex-wrap items-center justify-between gap-4 p-4`}
            title={`Double-click to open ${entry.item.name}`}
            tabIndex={0}
            onDoubleClick={() => openEntry(entry)}
            onKeyDown={(event) => {
              if (event.target === event.currentTarget && event.key === 'Enter')
                openEntry(entry);
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400">
                {entry.itemType === 'folder' ? (
                  <Folder className="size-4" aria-hidden="true" />
                ) : (
                  <FileText className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate">{entry.item.name}</p>
                <p className="text-xs text-zinc-400">
                  Shared by{' '}
                  {entry.sharedBy?.name ||
                    entry.sharedBy?.email ||
                    'StoreX user'}{' '}
                  · {entry.permissions.join(', ')}
                </p>
              </div>
            </div>
            <ItemActionsMenu
              item={{ ...entry.item, permissions: entry.permissions }}
              itemType={entry.itemType}
              shared
            />
          </article>
        ))
      )}
    </div>
  );
}
