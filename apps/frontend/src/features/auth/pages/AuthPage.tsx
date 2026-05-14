import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, LoginDto, RegisterDto, Role } from '@hospeon/shared';
import { useLogin, useRegister } from '@/features/auth/hooks/useAuthQueries';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  UserIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/Button';
import { MonoNumber } from '@/components/ui/MonoNumber';
import { StatusBadge } from '@/components/ui/StatusBadge';

type AuthMode = 'login' | 'register';
type AuthFormValues = LoginDto & Partial<Pick<RegisterDto, 'name' | 'role'>>;

const roleOptions = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RECEPTIONIST,
  Role.NURSE,
  Role.PHARMACIST,
  Role.LAB_TECHNICIAN,
  Role.ACCOUNTANT,
  Role.STAFF,
];

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const isRegisterMode = mode === 'register';
  const activeMutation = isRegisterMode ? registerMutation : loginMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(isRegisterMode ? registerSchema : loginSchema),
    defaultValues: {
      role: Role.RECEPTIONIST,
    },
  });

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    reset({
      email: '',
      password: '',
      name: '',
      role: Role.RECEPTIONIST,
    });
  };

  const onSubmit = (data: AuthFormValues) => {
    if (isRegisterMode) {
      registerMutation.mutate(data as RegisterDto, {
        onSuccess: () => navigate('/dashboard'),
      });
      return;
    }

    loginMutation.mutate(data, {
      onSuccess: () => navigate('/dashboard'),
    });
  };

  return (
    <div className="min-h-screen flex bg-canvas dark:bg-canvas-dark">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-semibold">
              H
            </div>
            <div>
              <div className="text-base font-semibold">Hospeon</div>
              <div className="text-[11px] text-ink-tertiary -mt-0.5">by Webgeon</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight mb-1">
            {isRegisterMode ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-ink-secondary mb-8">
            {isRegisterMode
              ? 'Set up access to your clinic dashboard.'
              : 'Sign in to your clinic dashboard.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegisterMode && (
              <>
                <Input
                  label="Full name"
                  placeholder="Anjali Menon"
                  icon={<UserIcon />}
                  {...register('name')}
                  error={errors.name?.message}
                />

                <div className="w-full">
                  <label
                    htmlFor="role"
                    className="block text-xs font-medium text-ink-primary dark:text-ink-primary-dark mb-1.5">
                    Role
                  </label>
                  <select
                    id="role"
                    className="w-full h-9 rounded-lg bg-surface dark:bg-surface-dark border border-line dark:border-line-dark px-3 text-sm text-ink-primary dark:text-ink-primary-dark focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    {...register('role')}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <Input
              label="Email"
              placeholder="you@clinic.com"
              icon={<MailIcon />}
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              placeholder="Password"
              type={showPwd ? 'text' : 'password'}
              icon={<LockIcon />}
              {...register('password')}
              error={errors.password?.message}
              iconRight={
                <button type="button" onClick={() => setShowPwd((s) => !s)}>
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />

            {activeMutation.isError && (
              <p className="text-sm text-danger mt-2">
                {(activeMutation.error as any)?.message ||
                  (isRegisterMode ? 'Failed to create account' : 'Failed to login')}
              </p>
            )}

            {!isRegisterMode && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-ink-secondary">
                  <input type="checkbox" className="rounded text-accent" /> Remember this device
                </label>
                <a className="text-accent hover:underline" href="#">
                  Forgot password?
                </a>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={activeMutation.isPending}
              iconRight={<ArrowRightIcon />}>
              {activeMutation.isPending
                ? isRegisterMode
                  ? 'Creating account...'
                  : 'Signing in...'
                : isRegisterMode
                  ? 'Create account'
                  : 'Sign in'}
            </Button>

            {!isRegisterMode && (
              <Button type="button" variant="secondary" fullWidth disabled={loginMutation.isPending}>
                Sign in with OTP instead
              </Button>
            )}
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-secondary">
            <span>{isRegisterMode ? 'Already have an account?' : 'No account yet?'}</span>
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              className="w-auto px-2 text-accent hover:text-accent"
              onClick={() => switchMode(isRegisterMode ? 'login' : 'register')}>
              {isRegisterMode ? 'Sign in' : 'Create one'}
            </IconButton>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-ink-tertiary">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Protected by end-to-end encryption, SOC2 in progress, ABDM-ready</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-subtle dark:bg-subtle-dark border-l border-line dark:border-line-dark">
        <div className="w-full max-w-md">
          <div className="bg-surface dark:bg-surface-dark rounded-2xl shadow-soft border border-line dark:border-line-dark p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold">Good morning, Anjali</div>
                <div className="text-xs text-ink-tertiary">Hospeon Kochi, MG Road</div>
              </div>
              <StatusBadge tone="success" dot size="sm">
                Live
              </StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Appointments', v: '44' },
                { l: 'Waiting', v: '8' },
                { l: 'Revenue today', v: '68,420' },
                { l: 'Bed occupancy', v: '68%' },
              ].map((m) => (
                <div key={m.l} className="p-3 rounded-xl bg-subtle/60 dark:bg-subtle-dark/60">
                  <div className="text-[10px] uppercase tracking-wider text-ink-tertiary">
                    {m.l}
                  </div>
                  <MonoNumber size="xl" weight="semibold">
                    {m.v}
                  </MonoNumber>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-accent-soft border border-accent/15">
              <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
                AI Insight
              </div>
              <p className="text-xs text-ink-primary dark:text-ink-primary-dark">
                3 patients have waited over 20 minutes. Consider moving lab-pending patients to
                express queue.
              </p>
            </div>
          </div>
          <p className="mt-6 text-xs text-ink-tertiary text-center max-w-sm mx-auto leading-relaxed">
            Hospeon helped us cut patient wait time by 32% in the first month.
            <br />
            Dr. Anita Krishnan, Aster Clinic
          </p>
        </div>
      </div>
    </div>
  );
}

export function OTPVerify() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-canvas dark:bg-canvas-dark">
      <div className="w-full max-w-sm bg-surface dark:bg-surface-dark border border-line dark:border-line-dark rounded-2xl p-7 shadow-soft">
        <h1 className="text-xl font-semibold mb-1">Enter verification code</h1>
        <p className="text-sm text-ink-secondary mb-6">
          We sent a 6-digit code to <span className="font-mono">+91 98**** 22014</span>.{' '}
          <a className="text-accent hover:underline">Change number</a>
        </p>
        <div className="flex gap-2 justify-between mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <input
              key={i}
              maxLength={1}
              className="w-11 h-12 rounded-lg border border-line dark:border-line-dark text-center font-mono text-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          ))}
        </div>
        <p className="text-xs text-ink-tertiary mb-6">
          Resend code in <span className="font-mono">00:42</span>
        </p>
        <label className="flex items-center gap-2 text-xs text-ink-secondary mb-5">
          <input type="checkbox" className="rounded text-accent" /> Trust this device for 30 days
        </label>
        <Button variant="primary" fullWidth iconRight={<ArrowRightIcon />}>
          Verify and continue
        </Button>
      </div>
    </div>
  );
}
