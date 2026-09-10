import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  AuthShell,
  OAuthButtons,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from '@/components/auth/auth-shell';

const signinSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  twoFactorEnabled: z.boolean().optional(),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { signin } = useAuth();
  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorEnabled: false,
    },
  });

  return (
    <AuthShell
      eyebrow="Account access"
      title="Welcome back"
      description="Sign in to continue to your personal StoreX workspace."
    >
      <form
        onSubmit={form.handleSubmit((values) => signin.mutate(values))}
        className="space-y-5"
      >
        <div>
          <label htmlFor="signin-email" className={authLabelClass}>
            Email address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
              aria-hidden="true"
            />
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              className={`${authInputClass} pl-10 ${
                form.formState.errors.email ? 'border-rose-500/60' : ''
              }`}
              {...form.register('email')}
            />
          </div>
          {form.formState.errors.email && (
            <p className={authErrorClass}>
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="signin-password"
              className="text-xs font-medium text-zinc-300"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
              aria-hidden="true"
            />
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(form.formState.errors.password)}
              className={`${authInputClass} px-10 ${
                form.formState.errors.password ? 'border-rose-500/60' : ''
              }`}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className={authErrorClass}>
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={signin.isPending}
          className={authPrimaryButtonClass}
        >
          {signin.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {signin.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <OAuthButtons disabled={signin.isPending} />

      <p className="mt-7 text-center text-sm text-zinc-600">
        New to StoreX?{' '}
        <Link
          to="/signup"
          className="font-medium text-zinc-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
