<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  // Perform logout
  await authStore.logout()
  
  // If we're in an iframe, notify the parent window
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'LOGOUT_SUCCESS'
    }, '*')
  } else {
    // Redirect to login page
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