<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { UserRole } from '@/types/auth.types'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await authStore.fetchProfile()
  } catch (err: any) {
    error.value = err.message || 'Failed to load profile'
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const getRoleBadgeClass = (role: UserRole) => {
  if (role === UserRole.ADMIN) {
    return 'bg-purple-100 text-purple-800'
  }
  return 'bg-blue-100 text-blue-800'
}
</script>

<template>
  <div class="space-y-8">
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button 
        @click="router.push({ name: 'login' })" 
        class="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
        tabindex="0"
      >
        Return to login
      </button>
    </div>
    
    <div v-else-if="authStore.user" class="bg-white shadow rounded-lg overflow-hidden">
      <div class="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 class="text-lg font-medium leading-6 text-gray-900">User Profile</h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
      </div>
      
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-3">
            <dt class="text-sm font-medium text-gray-500">Full name</dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ authStore.user.firstName || '-' }} {{ authStore.user.lastName || '-' }}
            </dd>
          </div>
          
          <div class="sm:col-span-3">
            <dt class="text-sm font-medium text-gray-500">Email address</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ authStore.user.email }}</dd>
          </div>
          
          <div class="sm:col-span-3">
            <dt class="text-sm font-medium text-gray-500">Role</dt>
            <dd class="mt-1">
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full" 
                :class="getRoleBadgeClass(authStore.user.role)"
              >
                {{ authStore.user.role }}
              </span>
            </dd>
          </div>
          
          <div class="sm:col-span-3">
            <dt class="text-sm font-medium text-gray-500">Account status</dt>
            <dd class="mt-1">
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full" 
                :class="authStore.user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ authStore.user.isActive ? 'Active' : 'Inactive' }}
              </span>
            </dd>
          </div>
        </div>
      </div>
      
      <div class="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
        <button 
          @click="handleLogout" 
          class="btn btn-outline"
          tabindex="0"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template> 