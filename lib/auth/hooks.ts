'use client';

import { useAuthContext } from './auth-context';

/**
 * Drop-in replacement for @clerk/nextjs useAuth()
 * Returns identical shape so existing code works with import-path change only.
 */
export function useAuth() {
  const { isLoaded, isSignedIn, user, getToken, logout } = useAuthContext();

  return {
    isLoaded,
    isSignedIn,
    userId: user?.id ?? null,
    getToken,
    signOut: logout,
  };
}

/**
 * Drop-in replacement for @clerk/nextjs useUser()
 * Matches the exact property paths used in settings/page.tsx and useRazorpay.ts:
 *   user?.fullName
 *   user?.primaryEmailAddress?.emailAddress
 *   user?.createdAt
 */
export function useUser() {
  const { isLoaded, user } = useAuthContext();

  if (!user) {
    return { user: null, isLoaded };
  }

  return {
    isLoaded,
    user: {
      id: user.id,
      fullName: user.name,
      primaryEmailAddress: {
        emailAddress: user.email,
      },
      createdAt: new Date(user.createdAt),
    },
  };
}
