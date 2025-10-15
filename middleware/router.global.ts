import type { Auth } from "firebase/auth";
// import { useAuth } from '~/composables/firebase/useAuth'

export default defineNuxtRouteMiddleware((to, from) => {
  // const { logoutAsync } = useAuth();
  const auth = useState<Auth>('auth');
  // const user = useState<ExtendedUserProfile>('userProfile')
  // if (!user.value?.status || user.value?.status === 'inactive') {
  //   console.log('this account is inactive')
  //   logoutAsync().then(_ => {
  //     return { path: '/signin' };
  //   })
  // }
  if (!auth.value.currentUser && to.path != '/signin' && !to.path.includes('auth')) {
    return { path: '/signin' };
  }
  if (auth.value.currentUser && to.path == '/signin') {
    return { path: '/' };
  }
});