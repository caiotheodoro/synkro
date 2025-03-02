import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/logout",
      name: "logout",
      component: () => import("@/views/LogoutView.vue"),
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("@/views/ProfileView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/api/validate-token",
      name: "validate-token",
      component: () => import("@/views/ValidateTokenView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/NotFoundView.vue"),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  // Skip auth check for API endpoints
  if (to.path.startsWith("/api/")) {
    return next();
  }

  const authStore = useAuthStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "login" });
  }

  // Check if route requires guest (non-authenticated user)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: "profile" });
  }

  next();
});

export default router;
