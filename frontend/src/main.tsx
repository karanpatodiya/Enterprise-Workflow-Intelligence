import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { useAuthStore } from './store/auth'

// Auto-login for dev mode
if (import.meta.env.VITE_AUTH_TOKEN && import.meta.env.VITE_TENANT_ID) {
  useAuthStore.getState().login(
    import.meta.env.VITE_AUTH_TOKEN, 
    import.meta.env.VITE_TENANT_ID, 
    { id: 'dev-user', email: 'admin@acmecorp.com', roles: ['admin'], permissions: ['read:analytics', 'write:analytics'] }
  );
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
