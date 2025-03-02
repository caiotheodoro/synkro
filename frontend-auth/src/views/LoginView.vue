<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { sendAuthSuccess, sendAuthError, sendAuthStatus } from '@/utils/messaging'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showError = ref(false)

const returnUrl = computed(() => route.query.returnUrl as string || '/')
const registerUrl = computed(() => `/register?returnUrl=${encodeURIComponent(returnUrl.value)}${isNeobrutalTheme.value ? '&theme=neobrutal' : ''}`)
const isNeobrutalTheme = computed(() => route.query.theme === 'neobrutal')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  showError.value = false
  
  try {
    const response = await authStore.login({
      email: email.value,
      password: password.value
    })
    
    if (window.parent !== window) {
      sendAuthSuccess(authStore.user, response.access_token)
      sendAuthStatus(true, authStore.user, response.access_token)
    } else {
      showError.value = true
      router.push('/profile')
    }
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || 'Failed to login'
    
    if (window.parent !== window) {
      sendAuthError(error.value)
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
      sendAuthSuccess(authStore.user, token || '')
      sendAuthStatus(true, authStore.user, token || '')
    } else {
      sendAuthStatus(false)
    }
  }

  if (authStore.isAuthenticated) {
    if (window.parent !== window) {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "auth_token")
      sendAuthSuccess(authStore.user, token || '')
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
    <div :class="[isNeobrutalTheme ? 'auth-container' : 'w-full max-w-md p-6']">
      <div :class="[isNeobrutalTheme ? 'auth-card' : 'bg-white p-6 rounded-lg shadow-md']">
        
        <div v-if="error && showError" :class="[isNeobrutalTheme ? 'alert alert-error' : 'text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-md']">
          {{ error }}
        </div>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div :class="[isNeobrutalTheme ? 'form-group' : '']">
            <label 
              for="email" 
              :class="[isNeobrutalTheme ? 'form-label' : 'block text-sm font-medium text-gray-700 mb-1']"
            >
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              :class="[
                isNeobrutalTheme ? 'form-input' : 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              ]"
            />
          </div>
          
          <div :class="[isNeobrutalTheme ? 'form-group' : '']">
            <label 
              for="password" 
              :class="[isNeobrutalTheme ? 'form-label' : 'block text-sm font-medium text-gray-700 mb-1']"
            >
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              :class="[
                isNeobrutalTheme ? 'form-input' : 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
              ]"
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
              <span v-else>Sign In</span>
            </button>
          </div>
        </form>
        
        <div :class="'relative flex items-center justify-center mt-6 mb-6'">
          <span :class="' divider-text px-2 bg-white text-xs text-gray-500'">
            OR
          </span>
        </div>
        
        <div class="text-center">
          <p :class="'text-sm text-gray-600'">
            Don't have an account?
            <a 
              :href="registerUrl" 
              :class="'auth-link font-medium text-primary hover:text-primary-dark'"
            >
              Register Now
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>