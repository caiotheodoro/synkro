<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { sendLogout, sendAuthStatus } from '@/utils/messaging'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  await authStore.logout()
  
  if (window.parent !== window) {
    sendLogout()
    sendAuthStatus(false)
    
    try {
      localStorage.setItem("auth_state_timestamp", Date.now().toString());
    } catch (e) {
      console.error("Error setting auth state timestamp:", e);
    }
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-lg">Signing out...</p>
      <div class="mt-4">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  </div>
</template> 