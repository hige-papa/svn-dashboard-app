import type { Auth } from "firebase/auth";
// import { useAuth } from '~/composables/firebase/useAuth'

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useState<Auth>('auth');
  if (!auth.value.currentUser && to.path != '/signin' && !to.path.includes('auth')) {
    return { path: '/signin' };
  }
  if (auth.value.currentUser && to.path == '/signin') {
    return { path: '/' };
  }
});