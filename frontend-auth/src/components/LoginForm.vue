<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { LoginCredentials } from '@/types/auth.types'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive<LoginCredentials>({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: '',
  general: ''
})

const isSubmitting = ref(false)

const validateForm = (): boolean => {
  let isValid = true
  
  // Reset errors
  errors.email = ''
  errors.password = ''
  errors.general = ''
  
  // Email validation
  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }
  
  // Password validation
  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    await authStore.login(form)
    router.push({ name: 'profile' })
  } catch (error: any) {
    errors.general = error.response?.data?.message || 'Login failed. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div v-if="errors.general" class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-sm text-red-600">{{ errors.general }}</p>
    </div>
    
    <div>
      <label for="email" class="form-label">Email</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        autocomplete="email"
        class="form-input"
        :class="{ 'border-red-300': errors.email }"
        aria-label="Email address"
        tabindex="0"
      />
      <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
    </div>
    
    <div>
      <label for="password" class="form-label">Password</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        class="form-input"
        :class="{ 'border-red-300': errors.password }"
        aria-label="Password"
        tabindex="0"
      />
      <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
    </div>
    
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <input
          id="remember-me"
          type="checkbox"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          tabindex="0"
        />
        <label for="remember-me" class="ml-2 block text-sm text-gray-700">Remember me</label>
      </div>
      
      <div class="text-sm">
        <router-link
          to="/forgot-password"
          class="font-medium text-primary-600 hover:text-primary-500"
          tabindex="0"
        >
          Forgot your password?
        </router-link>
      </div>
    </div>
    
    <div>
      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="isSubmitting"
        tabindex="0"
      >
        <span v-if="isSubmitting">Signing in...</span>
        <span v-else>Sign in</span>
      </button>
    </div>
    
    <div class="text-center">
      <p class="text-sm text-gray-600">
        Don't have an account?
        <router-link
          to="/register"
          class="font-medium text-primary-600 hover:text-primary-500"
          tabindex="0"
        >
          Sign up
        </router-link>
      </p>
    </div>
  </form>
</template> 