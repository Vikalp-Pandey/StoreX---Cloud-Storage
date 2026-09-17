import { api } from '@/lib/axios';
import env from '@packages/env/client';
import { z } from 'zod';

export type OAuthProvider = 'google' | 'github';

const apiBaseUrl = env.VITE_BASE_BACKEND_URL.replace(/\/+$/, '');

export const signinSchema = z.object({
  email: z.string('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type SigninFormValues = z.infer<typeof signinSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;

export const authApi = {
  getOAuthUrl: (provider: OAuthProvider) => `${apiBaseUrl}/auth/${provider}`,

  signup: async (data: SignupFormValues) => {
    const res = await api.post('/auth/signup', data);
    return res.data;
  },

  signin: async (data: SigninFormValues) => {
    const res = await api.post('/auth/signin', data);
    return res.data;
  },

  verifyOTP: async (data: { otp: string }) => {
    const res = await api.post('/auth/verify-OTP', data);
    return res.data;
  },

  verifyEmail: async (data: {
    challengeId: string;
    email: string;
    otp: string;
  }) => {
    const res = await api.post('/auth/verify-email', data);
    return res.data;
  },

  getUserStatus: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const res = await api.post('/auth/forgot-password', data);
    return res.data;
  },

  resetPassword: async (data: { token: string; password: string }) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};
