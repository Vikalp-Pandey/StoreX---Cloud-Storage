import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, User } from 'lucide-react';
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

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start your workspace"
      description="Create your StoreX identity, then verify your email to continue."
    >
      <form
        onSubmit={form.handleSubmit((values) => signup.mutate(values))}
        className="space-y-5"
      >
        <div>
          <label htmlFor="signup-name" className={authLabelClass}>
            Full name
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
              aria-hidden="true"
            />
            <input
              id="signup-name"
              autoComplete="name"
              placeholder="Enter your full name"
              aria-invalid={Boolean(form.formState.errors.name)}
              className={`${authInputClass} pl-10 ${
                form.formState.errors.name ? 'border-rose-500/60' : ''
              }`}
              {...form.register('name')}
            />
          </div>
          {form.formState.errors.name && (
            <p className={authErrorClass}>
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-email" className={authLabelClass}>
            Email address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
              aria-hidden="true"
            />
            <input
              id="signup-email"
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
          <label htmlFor="signup-password" className={authLabelClass}>
            Password
          </label>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
              aria-hidden="true"
            />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 6 characters"
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
          disabled={signup.isPending}
          className={authPrimaryButtonClass}
        >
          {signup.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {signup.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <OAuthButtons disabled={signup.isPending} />

      <p className="mt-7 text-center text-sm text-zinc-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-zinc-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
