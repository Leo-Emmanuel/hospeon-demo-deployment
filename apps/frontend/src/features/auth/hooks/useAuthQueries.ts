import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { LoginDto, RegisterDto } from '@hospeon/shared';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.data.user);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: (response) => {
      setAuth(response.data.user);
    },
  });
};

export const useCurrentUser = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const response = await authApi.getMe();
        setAuth(response.data);
        return response.data;
      } catch (error) {
        setAuth(null);
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });
};
