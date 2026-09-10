import { useForm } from 'react-hook-form';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  AuthShell,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from '@/components/auth/auth-shell';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ defaultValues: { email: '' } });

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your account email and we’ll send you a secure reset link."
    >
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to sign in
      </Link>

      {forgotPassword.isSuccess ? (
        <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-5">
          <CheckCircle2
            className="size-5 text-emerald-400"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-sm font-medium text-zinc-100">
            Check your inbox
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            If an account exists for that email, its reset link is on the way.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((data) => forgotPassword.mutate(data))}
          className="space-y-5"
        >
          <div>
            <label htmlFor="recovery-email" className={authLabelClass}>
              Email address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
                aria-hidden="true"
              />
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                aria-invalid={Boolean(errors.email)}
                className={`${authInputClass} pl-10 ${
                  errors.email ? 'border-rose-500/60' : ''
                }`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className={authErrorClass}>{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={forgotPassword.isPending}
            className={authPrimaryButtonClass}
          >
            {forgotPassword.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {forgotPassword.isPending ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
