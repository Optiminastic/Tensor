import { createAuthClient } from 'better-auth/react'

// baseURL is intentionally omitted: the client then calls the auth API on the
// SAME origin the app was loaded from (window.location.origin). That lets both
// http://localhost:3001 and the ngrok URL work without a rebuild. The server
// (lib/auth.ts) still issues JWTs with the fixed BETTER_AUTH_URL issuer, so the
// backend's issuer contract is unaffected by which origin you sign in from.
export const authClient = createAuthClient()

export const { signIn, signOut, signUp, useSession } = authClient
