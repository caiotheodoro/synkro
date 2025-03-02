<template>
  <div>
    <!-- This is an API endpoint, no UI needed -->
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import {  sendAuthStatus } from '@/utils/messaging';

const authStore = useAuthStore();

onMounted(async () => {
  const requestData = await parseRequestData();
  
  if (!requestData || !requestData.token) {
    respondWithJson({ valid: false, message: 'No token provided' });
    if (window.parent !== window) {
      sendAuthStatus(false);
    }
    return;
  }
  
  try {
    const isValid = await validateToken(requestData.token);
    respondWithJson({ valid: isValid });
    
    if (window.parent !== window) {
      if (isValid) {
        if (authStore.isAuthenticated) {
          const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "auth_token");
          sendAuthStatus(true, authStore.user, token || '');
        } else {
          sendAuthStatus(true);
        }
      } else {
        sendAuthStatus(false);
      }
    }
  } catch (error) {
    console.error('Error validating token:', error);
    respondWithJson({ valid: false, message: 'Error validating token' });
    
    if (window.parent !== window) {
      sendAuthStatus(false);
    }
  }
});

async function parseRequestData() {
  try {
    const request = await new Promise.resolve<Request>((resolve) => {
      resolve(new Request(window.location.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: new URLSearchParams(window.location.search).get('token') })
      }));
    });
    
    if (request.method !== 'POST') {
      return null;
    }
    
    return await request.json();
  } catch (error) {
    console.error('Error parsing request data:', error);
    return null;
  }
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const response = await axios.post(`${apiUrl}/auth/validate-token`, { token });
    
    console.log('Token validation response:', response.data);
    
    return response.data.isValid === true;
  } catch (error) {
    console.error('Error validating token with API gateway:', error);
    return false;
  }
}

function respondWithJson(data: any) {
  document.body.innerHTML = `<pre>${JSON.stringify(data)}</pre>`;
}
</script> 