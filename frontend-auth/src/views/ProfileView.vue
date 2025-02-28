<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import UserProfile from '@/components/UserProfile.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <div class="min-h-screen py-12 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="sm:mx-auto sm:w-full">
        <img 
          class="mx-auto h-12 w-auto" 
          src="@/assets/logo.svg" 
          alt="Synkro Logo"
        />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Your Profile
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Manage your account information
        </p>
      </div>

      <div class="mt-8">
        <UserProfile />
      </div>
    </div>
  </div>
</template> 