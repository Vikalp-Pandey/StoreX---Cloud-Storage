import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  AuthShell,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from '@/components/auth/auth-shell';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const token = searchParams.get('token');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Use at least eight characters and avoid a password you use elsewhere."
    >
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to sign in
      </Link>

      {!token ? (
        <div className="rounded-xl border border-rose-900/70 bg-rose-950/20 p-5">
          <h3 className="text-sm font-medium text-zinc-100">
            Reset link is missing or invalid
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Request a fresh password-reset email and open the link from your
            inbox.
          </p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-flex text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            Request another link
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((data) =>
            resetPassword.mutate({ token, password: data.password }),
          )}
          className="space-y-5"
        >
          {[
            {
              id: 'new-password',
              label: 'New password',
              field: 'password' as const,
              autoComplete: 'new-password',
            },
            {
              id: 'confirm-password',
              label: 'Confirm password',
              field: 'confirmPassword' as const,
              autoComplete: 'new-password',
            },
          ].map(({ id, label, field, autoComplete }) => (
            <div key={id}>
              <label htmlFor={id} className={authLabelClass}>
                {label}
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
                  aria-hidden="true"
                />
                <input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={autoComplete}
                  placeholder="Enter your new password"
                  aria-invalid={Boolean(errors[field])}
                  className={`${authInputClass} px-10 ${
                    errors[field] ? 'border-rose-500/60' : ''
                  }`}
                  {...register(field)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                  aria-label={
                    showPassword ? 'Hide passwords' : 'Show passwords'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors[field] && (
                <p className={authErrorClass}>{errors[field]?.message}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={resetPassword.isPending}
            className={authPrimaryButtonClass}
          >
            {resetPassword.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {resetPassword.isPending
              ? 'Updating password...'
              : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
