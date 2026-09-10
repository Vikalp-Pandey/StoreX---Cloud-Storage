import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Download,
  Share2,
  X,
  FileText,
  Folder,
  FolderOpen,
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

export function UploadButton({ parent }: { parent?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();
  const upload = useMutation({
    mutationFn: () =>
      filesApi.upload({ file: file!, parent, onProgress: setProgress }),
    onSuccess: () => {
      setFile(null);
      setProgress(0);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File uploaded.');
    },
    onError: (error) => toast.error(message(error)),
  });
  return (
    <div>
      <button
        className={`${primaryButton.replace('px-4', 'px-0')} size-10 shrink-0`}
        onClick={() => setOpen(!open)}
        aria-label="Upload file"
        title="Upload file"
        aria-expanded={open}
      >
        <Upload className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <div className={`${panelClass} mt-3 max-w-sm space-y-3 p-4`}>
          <input
            ref={input}
            type="file"
            className="sr-only"
            aria-label="Choose file"
            disabled={upload.isPending}
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              event.target.value = '';
            }}
          />
          <button
            className="w-full rounded-xl border-2 border-dashed border-white/20 p-6 text-sm"
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!upload.isPending)
                setFile(event.dataTransfer.files[0] || null);
            }}
          >
            <span className="mb-3 flex justify-center text-[#b4b4b4]">
              {file ? (
                <FileText className="size-7" aria-hidden="true" />
              ) : (
                <Upload className="size-7" aria-hidden="true" />
              )}
            </span>
            {file
              ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
              : 'Click or drag a file here'}
          </button>
          <div className="flex gap-2">
            <button
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
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </button>
            {file && !upload.isPending && (
              <button
                className={iconButton}
                onClick={() => setFile(null)}
                aria-label="Remove selected file"
                title="Remove selected file"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {upload.isPending && (
            <p className="text-xs" role="status">
              {progress}% uploaded
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ShareButton({
  item,
  itemType,
}: {
  item: StoredFile | StoredFolder;
  itemType: 'file' | 'folder';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={iconButton}
        title={`Share ${item.name}`}
        onClick={() => setOpen(true)}
        aria-label={`Share ${item.name}`}
      >
        <Share2 className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <ShareDialog
          item={item}
          itemType={itemType}
          onClose={() => setOpen(false)}
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
      className="m-auto w-full max-w-lg rounded-2xl border border-white/15 bg-[#262626] p-6 text-white backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="share-title"
          className="flex min-w-0 items-center gap-2 text-lg"
        >
          <Share2
            className="size-5 shrink-0 text-[#b4b4b4]"
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
            className="mt-2 w-full rounded-lg border border-white/20 bg-[#212121] p-3"
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
          {(['read', 'create', 'delete'] as Permission[]).map((permission) => {
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
                <Icon className="size-4 text-[#b4b4b4]" aria-hidden="true" />
                {permission}
              </label>
            );
          })}
        </fieldset>
        <p className="text-xs text-[#b4b4b4]">
          Share with an existing StoreX account. Folder sharing includes its
          existing files and subfolders.
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
        <Users className="size-4 text-[#b4b4b4]" aria-hidden="true" />
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
          <div key={record._id} className="mt-3 border-t border-white/10 pt-3">
            <p className="break-all text-sm">
              {record.recipient?.email || 'Deleted account'}
              <span className="block text-xs text-[#b4b4b4]">
                {record.permissions.join(', ')}
              </span>
            </p>
          </div>
        ))
      )}
    </dialog>
  );
}

export function FileActions({
  file,
  shared = false,
}: {
  file: StoredFile;
  shared?: boolean;
}) {
  const download = useMutation({
    mutationFn: () => filesApi.download(file.url, file.name),
    onError: (error) => toast.error(message(error)),
  });
  return (
    <div className="flex flex-wrap gap-2">
      {(!shared || file.permissions?.includes('read')) && (
        <button
          className={iconButton}
          aria-label={
            download.isPending
              ? `Downloading ${file.name}`
              : `Download ${file.name}`
          }
          title={download.isPending ? 'Downloading…' : 'Download'}
          disabled={download.isPending}
          onClick={() => download.mutate()}
        >
          {download.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
        </button>
      )}
      {!shared && <ShareButton item={file} itemType="file" />}
    </div>
  );
}

export function SharedView() {
  const [trail, setTrail] = useState<SharedEntry[]>([]);
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
  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-3 text-2xl">
        <Users className="size-6 text-[#b4b4b4]" aria-hidden="true" />
        Shared with me
      </h1>
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
      {root.isLoading ? (
        <p role="status">Loading shared items…</p>
      ) : root.isError ? (
        <p>Could not load shared items.</p>
      ) : !entries.length ? (
        <p>No shared items here.</p>
      ) : (
        entries.map((entry) => (
          <article
            key={entry.item._id}
            className={`${panelClass} flex flex-wrap items-center justify-between gap-4 p-4`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#2f2f2f] text-[#b4b4b4]">
                {entry.itemType === 'folder' ? (
                  <Folder className="size-4" aria-hidden="true" />
                ) : (
                  <FileText className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate">{entry.item.name}</p>
                <p className="text-xs text-[#b4b4b4]">
                  From{' '}
                  {entry.sharedBy?.name ||
                    entry.sharedBy?.email ||
                    'StoreX user'}{' '}
                  · {entry.permissions.join(', ')}
                </p>
              </div>
            </div>
            {entry.itemType === 'folder' ? (
              <button
                className={iconButton}
                aria-label={`Open ${entry.item.name}`}
                title={`Open ${entry.item.name}`}
                onClick={() => setTrail([...trail, entry])}
              >
                <FolderOpen className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <FileActions
                file={{
                  ...(entry.item as StoredFile),
                  permissions: entry.permissions,
                }}
                shared
              />
            )}
          </article>
        ))
      )}
    </div>
  );
}
