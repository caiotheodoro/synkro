<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <img 
          class="mx-auto h-12 w-auto" 
          src="@/assets/logo.svg" 
          alt="Synkro Logo"
        />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          404 - Page Not Found
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
        <button 
          @click="goBack" 
          class="btn btn-outline"
          tabindex="0"
        >
          Go Back
        </button>
        <button 
          @click="goHome" 
          class="btn btn-primary"
          tabindex="0"
        >
          Go to Login
        </button>
      </div>
    </div>
  </div>
</template> 