import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { AuthService } from "@/services/auth.service";
import type { User, LoginCredentials, RegisterData } from "@/types/auth.types";

export const useAuthStore = defineStore("auth", () => {
  const authService = new AuthService();

  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (credentials: LoginCredentials) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.login(credentials);
      user.value = response.user;
      token.value = response.access_token;
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to login";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData: RegisterData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.register(userData);
      user.value = response.user;
      token.value = response.access_token;
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to register";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    user.value = null;
    token.value = null;
    authService.clearToken();
  };

  const fetchProfile = async () => {
    if (!token.value) return null;

    loading.value = true;
    error.value = null;

    try {
      const profile = await authService.getProfile();
      user.value = profile;
      return profile;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch profile";
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const initAuth = async () => {
    const savedToken = authService.getToken();
    if (savedToken) {
      token.value = savedToken;
      try {
        await fetchProfile();
      } catch (err) {
        logout();
      }
    }
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    initAuth,
  };
});
