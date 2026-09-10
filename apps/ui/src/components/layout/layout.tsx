import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel */}
      <div className="hidden lg:flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-12">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold">Storex Cloud</h1>

          <p className="text-lg opacity-90">
            Securely upload, store and manage your files with blazing fast cloud
            storage.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
