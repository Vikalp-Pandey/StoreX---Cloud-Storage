import type { ReactNode } from 'react';
import { HardDrive, Layers, LockKeyhole, ShieldCheck } from 'lucide-react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { authApi, type OAuthProvider } from '@/api/auth.api';

export const authLabelClass = 'mb-2 block text-xs font-medium text-zinc-300';

export const authInputClass =
  'h-11 min-w-0 w-full rounded-xl border border-zinc-800 bg-black px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-800';

export const authPrimaryButtonClass =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-700 px-4 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-45';

export const authErrorClass = 'mt-2 text-xs text-rose-400';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-zinc-700">
      <header className="flex h-16 items-center border-b border-zinc-800 bg-black px-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <span className="flex size-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900">
              <Layers className="size-4 text-zinc-100" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold tracking-[0.28em] text-white">
              STOREX
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <LockKeyhole className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Secure account access</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full min-w-0 max-w-[1600px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_32rem]">
        <section className="hidden border-r border-zinc-800 px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Personal workspace
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white xl:text-5xl xl:leading-[1.08]">
              Your files, permissions, and storage in one secure workspace.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-zinc-500">
              Sign in to organize assets, monitor storage, and manage access
              with the same focused interface used across StoreX.
            </p>
          </div>

          <div className="grid max-w-2xl gap-3 xl:grid-cols-3">
            {[
              {
                icon: HardDrive,
                label: 'Storage',
                value: 'Private by default',
              },
              {
                icon: ShieldCheck,
                label: 'Access',
                value: 'Permission aware',
              },
              {
                icon: LockKeyhole,
                label: 'Session',
                value: 'Securely managed',
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <Icon className="size-4 text-zinc-500" aria-hidden="true" />
                <p className="mt-5 text-xs text-zinc-600">{label}</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
          <div className="w-full min-w-0 max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black sm:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                {eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {description}
              </p>
            </div>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

export function OAuthButtons({ disabled = false }: { disabled?: boolean }) {
  const startOAuth = (provider: OAuthProvider) => {
    window.location.assign(authApi.getOAuthUrl(provider));
  };

  return (
    <div className="mt-7">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Or continue with
        </span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => startOAuth('google')}
          disabled={disabled}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <FaGoogle className="size-4" aria-hidden="true" />
          Google
        </button>
        <button
          type="button"
          onClick={() => startOAuth('github')}
          disabled={disabled}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <FaGithub className="size-4" aria-hidden="true" />
          GitHub
        </button>
      </div>
    </div>
  );
}
