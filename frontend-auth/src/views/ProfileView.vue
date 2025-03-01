<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { sendLogout } from '@/utils/messaging'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isNeobrutalTheme = ref(false)

const handleLogout = async () => {
  
  if (window.parent !== window) {
    sendLogout()
  }
  
  await authStore.logout()
  
  router.push('/login')
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  
  const urlParams = new URLSearchParams(window.location.search)
  isNeobrutalTheme.value = urlParams.get('theme') === 'neobrutal'
  
  if (isNeobrutalTheme.value) {
    document.body.classList.add('neobrutal-theme')
  } else {
    document.body.classList.remove('neobrutal-theme')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-transparent min-w-[300px]">
    <div :class="[isNeobrutalTheme ? 'auth-container' : 'w-full max-w-lg p-6']">
      <div :class="[isNeobrutalTheme ? 'auth-card' : 'bg-white p-6 rounded-lg shadow-md']">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold">Profile</h1>
          <p class="text-gray-600 mt-2">Welcome back!</p>
        </div>
        
        <div class="space-y-4">
          <div class="border-b pb-4">
            <div class="flex items-center justify-between gap-10">
              <span class="text-sm text-gray-500">Name</span>
              <span class="font-medium">{{ user?.name }}</span>
            </div>
          </div>
          
          <div class="border-b pb-4">
            <div class="flex items-center justify-between gap-10">
              <span class="text-sm text-gray-500">Email</span>
              <span class="font-medium">{{ user?.email }}</span>
            </div>
          </div>
          
          <div class="pt-4">
            <button
              @click="handleLogout"
              :class="'btn btn-primary py-2 px-4 border-transparent text-sm text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-offset-2 focus:ring-primary inline-flex items-center justify-center rounded-md font-bold border-[3px] transition-all duration-200 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none w-full'"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 