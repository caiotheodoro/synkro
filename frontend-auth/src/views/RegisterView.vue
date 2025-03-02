<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { sendRegistrationSuccess, sendRegistrationError, sendAuthStatus } from '@/utils/messaging'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const showError = ref(false) 

const returnUrl = computed(() => route.query.returnUrl as string || '/')

const loginUrl = computed(() => `/login?returnUrl=${encodeURIComponent(returnUrl.value)}${isNeobrutalTheme.value ? '&theme=neobrutal' : ''}`)

const isNeobrutalTheme = computed(() => route.query.theme === 'neobrutal')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  showError.value = false
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    
    if (window.parent !== window) {
      sendRegistrationError(error.value)
      sendAuthStatus(false)
    } else {
      showError.value = true
    }
    
    loading.value = false
    return
  }
  
  try {
    const response = await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value
    })
    
    
    if (window.parent !== window) {
      sendRegistrationSuccess(authStore.user, response.access_token)
      sendAuthStatus(true, authStore.user, response.access_token)
    } else {
      router.push('/profile')
    }
  } catch (err: any) {
    console.error('Registration error:', err)
    error.value = err.message || 'Failed to register'
    
    if (window.parent !== window) {
      sendRegistrationError(error.value)
      sendAuthStatus(false)
    } else {
      showError.value = true
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (window.parent !== window) {
    if (authStore.isAuthenticated) {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "auth_token")
      sendAuthStatus(true, authStore.user, token || '')
    } else {
      sendAuthStatus(false)
    }
  }

  if (authStore.isAuthenticated) {
    if (window.parent !== window) {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "auth_token")
      sendRegistrationSuccess(authStore.user, token || '')
    } else {
      router.push('/profile')
    }
  }
  
  if (isNeobrutalTheme.value) {
    document.body.classList.add('neobrutal-theme')
  } else {
    document.body.classList.remove('neobrutal-theme')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-transparent">
    <div :class="'auth-container w-full max-w-md p-6 py-0'">
      <div :class="'auth-card  bg-white p-6 rounded-lg '">
        <div v-if="error && showError" :class="'alert alert-error text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-md'">
          {{ error }}
        </div>
        
        <form @submit.prevent="handleRegister" class="space-y-3">
          <div :class="'form-group'">
            <label 
              for="name" 
              :class="'form-label block text-sm font-medium text-gray-700 mb-1'"
            >
              Full Name
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              required
              :class="'form-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'"
            />
          </div>
          
          <div :class="[isNeobrutalTheme ? 'form-group' : '']">
            <label 
              for="email" 
              :class="'form-label block text-sm font-medium text-gray-700 mb-1'"
            >
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              :class="'form-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'"
            />
          </div>
          
          <div :class="'form-group'">
            <label 
              for="password" 
              :class="'form-label block text-sm font-medium text-gray-700 mb-1'"
            >
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              :class="'form-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'"
            />
          </div>
          
          <div :class="[isNeobrutalTheme ? 'form-group' : '']">
            <label 
              for="confirmPassword" 
              :class="'form-label block text-sm font-medium text-gray-700 mb-1'"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              :class="'form-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'"
            />
          </div>
          
          <div>
            <button
              type="submit"
              :disabled="loading"
              :class="'btn btn-primary  py-2 px-4  border-transparent  text-sm  text-white bg-primary hover:bg-primary-dark  focus:ring-2 focus:ring-offset-2 focus:ring-primary inline-flex items-center justify-center rounded-md font-bold border-[3px] transition-all duration-200 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none disabled:opacity-50 disabled:pointer-events-none w-full'
              "
            >
              <span v-if="loading">Loading...</span>
              <span v-else>Create Account</span>
            </button>
          </div>
        </form>
        
        <div :class="'dividerrelative flex items-center justify-center mt-6 mb-6'">
          <span :class=" 'divider-text px-2 bg-white text-sm text-gray-500'">
            OR
          </span>
        </div>
        
        <div class="text-center">
          <p :class=" 'text-sm text-gray-600'">
            Already have an account?
            <a 
              :href="loginUrl" 
              :class="'auth-link font-medium text-primary hover:text-primary-dark'"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template> 