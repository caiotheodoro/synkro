<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { RegisterData } from '@/types/auth.types'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: ''
})

// Compute the full name from firstName and lastName
const fullName = computed(() => {
  const first = form.firstName.trim()
  const last = form.lastName.trim()
  if (first && last) return `${first} ${last}`
  return first || last || ''
})

const errors = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  general: ''
})

const isSubmitting = ref(false)

const validateForm = (): boolean => {
  let isValid = true
  
  // Reset errors
  errors.email = ''
  errors.password = ''
  errors.firstName = ''
  errors.lastName = ''
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
    // Create the register data with the required name field
    const registerData: RegisterData = {
      email: form.email,
      password: form.password,
      name: fullName.value,
      firstName: form.firstName,
      lastName: form.lastName
    }
    
    await authStore.register(registerData)
    router.push({ name: 'profile' })
  } catch (error: any) {
    errors.general = error.response?.data?.message || 'Registration failed. Please try again.'
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
    
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label for="firstName" class="form-label">First Name</label>
        <input
          id="firstName"
          v-model="form.firstName"
          type="text"
          autocomplete="given-name"
          class="form-input"
          :class="{ 'border-red-300': errors.firstName }"
          aria-label="First name"
          tabindex="0"
        />
        <p v-if="errors.firstName" class="form-error">{{ errors.firstName }}</p>
      </div>
      
      <div>
        <label for="lastName" class="form-label">Last Name</label>
        <input
          id="lastName"
          v-model="form.lastName"
          type="text"
          autocomplete="family-name"
          class="form-input"
          :class="{ 'border-red-300': errors.lastName }"
          aria-label="Last name"
          tabindex="0"
        />
        <p v-if="errors.lastName" class="form-error">{{ errors.lastName }}</p>
      </div>
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
        autocomplete="new-password"
        class="form-input"
        :class="{ 'border-red-300': errors.password }"
        aria-label="Password"
        tabindex="0"
      />
      <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
      <p class="mt-1 text-sm text-gray-500">Password must be at least 8 characters</p>
    </div>
    
    <div>
      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="isSubmitting"
        tabindex="0"
      >
        <span v-if="isSubmitting">Creating account...</span>
        <span v-else>Create account</span>
      </button>
    </div>
    
    <div class="text-center">
      <p class="text-sm text-gray-600">
        Already have an account?
        <router-link
          to="/login"
          class="font-medium text-primary-600 hover:text-primary-500"
          tabindex="0"
        >
          Sign in
        </router-link>
      </p>
    </div>
  </form>
</template> 