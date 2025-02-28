<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import LoginForm from '@/components/LoginForm.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <img 
        class="mx-auto h-12 w-auto" 
        src="@/assets/logo.svg" 
        alt="Synkro Logo"
      />
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <LoginForm />
      </div>
    </div>
  </div>
</template> 