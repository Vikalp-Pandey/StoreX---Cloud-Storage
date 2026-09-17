import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { authApi } from '@/api/auth.api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<{ detail?: string }>(error)) return fallback;
  return error.response?.data?.detail || fallback;
};

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: authApi.getUserStatus,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};

// Hook for logging out
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
      navigate('/login');
      toast.error('Logged Out Successfully.');
    },
  });
};

export const useAuth = () => {
  const navigate = useNavigate();

  const signin = useMutation({
    mutationFn: authApi.signin,
    onSuccess: (data, variables) => {
      if (data?.data?.twoFactorRequired) {
        toast.info('Two-factor authentication required.');
        navigate('/verify-otp', { state: { email: variables.email } });
      } else {
        const successMessage = data?.detail;
        toast.success(successMessage);
        navigate('/dashboard');
      }
    },
    onError: (error: unknown) => {
      toast.error(
        getErrorMessage(
          error,
          'Authentication failed. Please check your credentials.',
        ),
      );
    },
  });

  const signup = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data, variables) => {
      const infoMessage = data?.detail;
      toast.info(infoMessage);
      navigate('/verify-otp', {
        state: {
          email: variables.email,
          challengeId: data?.data?.challengeId,
        },
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Registration failed.'));
    },
  });

  const verifyOtp = useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: (data) => {
      const successMessage = data?.detail;
      toast.success(successMessage);
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Unable to verify the code.'));
    },
  });

  const verifyEmail = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (data) => {
      toast.success(data?.detail);
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Unable to verify the code.'));
    },
  });

  const forgotPassword = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data) => {
      const successMessage = data?.detail;
      toast.success(successMessage);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Unable to send the reset link.'));
    },
  });

  const resetPassword = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (data) => {
      const successMessage = data?.detail;
      toast.success(successMessage);
      navigate('/login');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Unable to reset the password.'));
    },
  });

  const user = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getUserStatus,
    retry: false,
  });

  return {
    signin,
    signup,
    verifyOtp,
    verifyEmail,
    forgotPassword,
    resetPassword,
    user,
  };
};
