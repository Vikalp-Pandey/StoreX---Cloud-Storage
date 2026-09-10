import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, Timer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  AuthShell,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
} from '@/components/auth/auth-shell';

export default function VerifyOTPPage() {
  const { verifyOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300);
  const email = location.state?.email || 'your email address';
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ otp: string }>({ defaultValues: { otp: '' } });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = window.setInterval(
      () => setTimeLeft((current) => current - 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <AuthShell
      eyebrow="Email verification"
      title="Enter your verification code"
      description={`We sent a six-digit code to ${email}.`}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Go back
      </button>

      <form
        onSubmit={handleSubmit((data) => verifyOtp.mutate(data))}
        className="space-y-5"
      >
        <div>
          <label htmlFor="verification-code" className={authLabelClass}>
            Verification code
          </label>
          <input
            id="verification-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-invalid={Boolean(errors.otp)}
            className={`${authInputClass} h-14 text-center font-mono text-xl tracking-[0.35em] ${
              errors.otp ? 'border-rose-500/60' : ''
            }`}
            {...register('otp', {
              required: 'Verification code is required',
              pattern: {
                value: /^\d{6}$/,
                message: 'Enter the six-digit code',
              },
            })}
          />
          {errors.otp && <p className={authErrorClass}>{errors.otp.message}</p>}
        </div>

        <button
          type="submit"
          disabled={verifyOtp.isPending}
          className={authPrimaryButtonClass}
        >
          {verifyOtp.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {verifyOtp.isPending ? 'Verifying...' : 'Verify email'}
        </button>
      </form>

      <div className="mt-7 rounded-xl border border-zinc-800 bg-black p-4 text-center">
        <p className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Timer className="size-3.5" aria-hidden="true" />
          {timeLeft > 0
            ? `You can request another code in ${formattedTime}`
            : 'You can request another code now'}
        </p>
        <button
          type="button"
          disabled={timeLeft > 0}
          onClick={() => setTimeLeft(300)}
          className="mt-3 text-xs font-medium text-zinc-300 transition hover:text-white disabled:cursor-not-allowed disabled:text-zinc-700"
        >
          Request another code
        </button>
      </div>
    </AuthShell>
  );
}
