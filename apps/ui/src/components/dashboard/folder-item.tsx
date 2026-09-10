import { useState, type FormEvent, type ReactNode } from 'react';
import { Check, Folder, Loader2, Pencil, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { StoredFolder } from '@/api/files.api';

interface FolderItemProps {
  folder: StoredFolder;
  view: 'list' | 'grid';
  href: string;
  isRenaming: boolean;
  onRename: (folderId: string, name: string) => Promise<void>;
  actions?: ReactNode;
}

export function FolderItem({
  folder,
  view,
  href,
  isRenaming,
  onRename,
  actions,
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

  return (
    <article
      className={
        view === 'grid'
          ? 'group relative cursor-pointer rounded-xl border border-white/5 bg-[#212121] p-4 transition hover:border-white/10 hover:bg-[#2f2f2f]'
          : 'group relative grid cursor-pointer gap-2 px-5 py-4 transition hover:bg-[#2f2f2f] sm:grid-cols-[minmax(0,1fr)_160px_120px] sm:items-center sm:gap-4'
      }
    >
      {!isEditing && (
        <Link
          to={href}
          className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/25"
          aria-label={`Open ${folder.name}`}
        >
          <span className="sr-only">{`Open ${folder.name}`}</span>
        </Link>
      )}

      <div className="pointer-events-none relative z-10 flex min-w-0 items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#2f2f2f] text-[#b4b4b4] transition group-hover:bg-[#3a3a3a] group-hover:text-[#ececec]"
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
              className="h-9 min-w-0 flex-1 rounded-lg border border-white/15 bg-[#2f2f2f] px-3 text-sm text-[#ececec] outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
            />
            <button
              type="submit"
              disabled={isRenaming}
              className="rounded-lg p-2 text-[#c5c5c5] hover:bg-[#3a3a3a] hover:text-white disabled:opacity-50"
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
              className="rounded-lg p-2 text-[#b4b4b4] hover:bg-[#3a3a3a] hover:text-white disabled:opacity-50"
              aria-label="Cancel folder rename"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="pointer-events-auto min-w-0 max-w-full cursor-text rounded-md px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label={`Rename ${folder.name}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#ececec]">
                {folder.name}
              </p>
              {view === 'grid' && (
                <p className="mt-1 text-xs text-[#8e8e8e]">Folder</p>
              )}
            </div>
          </button>
        )}
      </div>

      <div className="relative z-10 flex items-center gap-2">
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            title="Rename folder"
            aria-label={'Rename ' + folder.name}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#2f2f2f] text-[#ececec] transition hover:bg-[#3a3a3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
        )}
        {actions}
      </div>
      <p className="text-xs text-[#b4b4b4]">
        {folder.size === '0' ? '0 B' : folder.size}
      </p>
    </article>
  );
}
