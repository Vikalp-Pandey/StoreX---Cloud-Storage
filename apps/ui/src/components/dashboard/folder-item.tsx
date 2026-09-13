import { useState, type FormEvent, type ReactNode } from 'react';
import { Check, Folder, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SharedBy, StoredFolder } from '@/api/files.api';

interface FolderItemProps {
  folder: StoredFolder;
  view: 'list' | 'grid';
  href: string;
  isRenaming: boolean;
  onRename: (folderId: string, name: string) => Promise<void>;
  canRename?: boolean;
  sharedBy?: SharedBy | null;
  actions?: ReactNode;
  onOpen?: () => void;
}

export function FolderItem({
  folder,
  view,
  href,
  isRenaming,
  onRename,
  canRename = true,
  sharedBy,
  actions,
  onOpen,
}: FolderItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(folder.name);

  const cancelEditing = () => {
    setDraftName(folder.name);
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draftName.trim();

    if (!name) {
      cancelEditing();
      return;
    }

    if (name === folder.name) {
      setIsEditing(false);
      return;
    }

    try {
      await onRename(folder._id, name);
      setDraftName(name);
      setIsEditing(false);
    } catch {
      // The parent keeps the editor open and displays the request error.
    }
  };

  const senderName = sharedBy?.name || sharedBy?.email;
  const folderDetails = (
    <div className="min-w-0">
      <p
        className={`truncate text-sm font-medium text-zinc-100 ${view === 'grid' ? 'pr-10' : ''}`}
      >
        {folder.name}
      </p>
      {senderName ? (
        <p className="mt-1 truncate text-xs text-zinc-500">
          Shared by {senderName}
        </p>
      ) : (
        view === 'grid' && <p className="mt-1 text-xs text-zinc-500">Folder</p>
      )}
    </div>
  );

  return (
    <article
      className={
        view === 'grid'
          ? 'group relative cursor-pointer rounded-xl border border-zinc-800 bg-black p-4 transition hover:border-zinc-800 hover:bg-zinc-900'
          : 'group relative grid cursor-pointer gap-2 px-5 py-4 transition hover:bg-zinc-900 sm:grid-cols-[minmax(0,1fr)_120px_48px] sm:items-center sm:gap-4'
      }
    >
      {!isEditing && (
        <Link
          to={href}
          onClick={onOpen}
          className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
          aria-label={`Open ${folder.name}`}
        >
          <span className="sr-only">{`Open ${folder.name}`}</span>
        </Link>
      )}

      <div className="pointer-events-none relative z-10 flex min-w-0 items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 transition group-hover:bg-zinc-800 group-hover:text-zinc-100"
          aria-hidden="true"
        >
          <Folder className="size-4" />
        </span>

        {isEditing ? (
          <form
            className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2"
            onSubmit={handleSubmit}
          >
            <label className="sr-only" htmlFor={`folder-name-${folder._id}`}>
              Folder name
            </label>
            <input
              id={`folder-name-${folder._id}`}
              autoFocus
              value={draftName}
              disabled={isRenaming}
              onChange={(event) => setDraftName(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-800"
            />
            <button
              type="submit"
              disabled={isRenaming}
              className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              aria-label="Save folder name"
            >
              {isRenaming ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              disabled={isRenaming}
              onClick={cancelEditing}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              aria-label="Cancel folder rename"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </form>
        ) : canRename ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="pointer-events-auto min-w-0 max-w-full cursor-text rounded-md px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label={`Rename ${folder.name}`}
          >
            {folderDetails}
          </button>
        ) : (
          folderDetails
        )}
      </div>

      <p className="text-xs text-zinc-400">
        {folder.size === '0' ? '0 B' : folder.size}
      </p>
      <div
        className={
          view === 'grid'
            ? 'absolute right-3 top-3 z-10'
            : 'relative z-10 flex justify-end'
        }
      >
        {actions}
      </div>
    </article>
  );
}
