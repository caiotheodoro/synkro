import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "@/services/api";
import type { User, RegisterData, LoginCredentials } from "@/types/auth.types";

const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || "auth_token";
const USER_KEY = import.meta.env.VITE_AUTH_USER_KEY || "auth_user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? "null")
  );
  const loading = ref(false);
  const error = ref<string | null>(null);
  let authCheckInterval: number | null = null;

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  function startAuthCheck() {
    if (typeof window === "undefined") return;

    if (authCheckInterval) {
      clearInterval(authCheckInterval);
    }

    validateToken();

    authCheckInterval = window.setInterval(() => {
      validateToken();
    }, 30000);
  }

  function stopAuthCheck() {
    if (authCheckInterval) {
      clearInterval(authCheckInterval);
      authCheckInterval = null;
    }
  }

  async function validateToken(): Promise<boolean> {
    if (!token.value) return false;

    try {
      const response = await api.post("/auth/validate-token", {
        token: token.value,
      });

      if (!response.data.isValid) {
        console.log("Token validation failed, clearing auth data");
        await logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      return false;
    }
  }

  async function login(credentials: LoginCredentials) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post("/auth/login", credentials);

      if (response?.data?.access_token && response.data.user) {
        token.value = response.data.access_token;
        user.value = response.data.user;

        if (token.value) {
          localStorage.setItem(TOKEN_KEY, token.value);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(user.value));

        startAuthCheck();

        return response.data;
      } else {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Login error:", err);

      if (err.message === "Invalid credentials") {
        error.value = "Invalid credentials";
        throw new Error(error.value || "Failed to login");
      }

      if (err.response?.data?.message) {
        error.value = err.response.data.message;
      } else {
        error.value = "Failed to login";
      }

      throw new Error(error.value ?? "Failed to login");
    } finally {
      loading.value = false;
    }
  }

  async function register(userData: RegisterData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post("/auth/register", userData);

      if (response?.data.access_token && response.data.user) {
        token.value = response.data.access_token;
        user.value = response.data.user;

        if (token.value) {
          localStorage.setItem(TOKEN_KEY, token.value);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(user.value));

        startAuthCheck();

        return response.data;
      } else {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Registration error:", err);

      if (err.message === "User already exists") {
        error.value = "User already exists";
        throw new Error(error.value || "Failed to register");
      }

      if (err.response?.data?.message) {
        error.value = err.response.data.message;
      } else {
        error.value = "Failed to register";
      }

      throw new Error(error.value ?? "Failed to register");
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      const currentToken = token.value;

      stopAuthCheck();

      token.value = null;
      user.value = null;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      if (currentToken) {
        try {
          await api.post("/auth/logout", { token: currentToken });
        } catch (err) {
          console.error("Error invalidating token with API gateway:", err);
        }
      }

      return true;
    } catch (err) {
      console.error("Logout error:", err);
      return false;
    }
  }

  async function fetchProfile() {
    if (!token.value) return null;

    try {
      const response = await api.get("/auth/profile");

      if (response.data) {
        user.value = response.data;
        localStorage.setItem(USER_KEY, JSON.stringify(user.value));
        return response.data;
      }

      return null;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  }

  async function initAuth() {
    token.value = localStorage.getItem(TOKEN_KEY);

    try {
      user.value = JSON.parse(localStorage.getItem(USER_KEY) ?? "null");
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      user.value = null;
    }

    if (token.value && !user.value) {
      await fetchProfile();
    }

    if (isAuthenticated.value) {
      startAuthCheck();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageEvent);
    }
  }

  function handleStorageEvent(event: StorageEvent) {
    if (
      event.key === TOKEN_KEY ||
      event.key === USER_KEY ||
      event.key === "token" ||
      event.key === "user" ||
      event.key === "auth_state_timestamp"
    ) {
      if (
        (event.key === TOKEN_KEY || event.key === "token") &&
        !event.newValue
      ) {
        logout();
        return;
      }

      const newToken =
        localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("token");

      if (newToken !== token.value) {
        token.value = newToken;

        try {
          const userJson =
            localStorage.getItem(USER_KEY) || localStorage.getItem("user");
          if (userJson) {
            user.value = JSON.parse(userJson);
          } else {
            user.value = null;
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
          user.value = null;
        }

        if (token.value) {
          startAuthCheck();
        } else {
          stopAuthCheck();
        }
      }
    }
  }

  initAuth();

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    initAuth,
    validateToken,
    startAuthCheck,
    stopAuthCheck,
  };
});
