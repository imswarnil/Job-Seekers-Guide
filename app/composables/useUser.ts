/**
 * Who is signed in, from `/api/me`, plus the sign-in and sign-out actions.
 *
 * Browser only. Pages are prerendered, so a user baked into the HTML would be
 * whoever happened to be signed in at build time (nobody). The state fills in
 * after hydration; `ready` says when it has.
 *
 * Sign-in goes through Neon Auth's SDK pointed at `/api/auth` on this site, which
 * the server proxies to Neon. The SDK is imported only when it is needed (the
 * login page, a sign-out, or an OAuth return), so no other page pays for it.
 */
export interface AppUser {
  id: string
  name: string
  email: string
  image: string | null
  isAdmin: boolean
}

interface MeResponse {
  user: AppUser | null
  authConfigured?: boolean
}

type AuthClient = {
  signIn: {
    social: (options: { provider: string, callbackURL?: string, newUserCallbackURL?: string }) => Promise<{ error?: { message?: string } | null }>
    email: (options: { email: string, password: string, callbackURL?: string }) => Promise<{ error?: { message?: string } | null }>
  }
  signUp: {
    email: (options: { email: string, password: string, name: string, callbackURL?: string }) => Promise<{ error?: { message?: string } | null }>
  }
  signOut: () => Promise<unknown>
  getSession: () => Promise<unknown>
}

let client: Promise<AuthClient> | undefined
/** One `/api/me` in flight at a time, however many components ask. */
let pending: Promise<void> | undefined

/** The Neon Auth client, created once, on first use, against our own proxy. */
export function useAuthClient(): Promise<AuthClient> {
  if (!client) {
    client = import('@neondatabase/auth').then(({ createAuthClient }) =>
      createAuthClient(`${window.location.origin}/api/auth`) as unknown as AuthClient)
  }
  return client
}

export function useUser() {
  const user = useState<AppUser | null>('app-user', () => null)
  const ready = useState('app-user-ready', () => false)
  const authConfigured = useState('app-auth-configured', () => true)

  async function refresh() {
    if (import.meta.server) {
      return
    }
    pending ||= (async () => {
      // A slow or failed check is retried rather than read as "signed out":
      // showing a signed-in reader a Sign in button is worse than a brief wait.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const me = await $fetch<MeResponse>('/api/me', { timeout: 12_000 })
          user.value = me.user
          authConfigured.value = me.authConfigured !== false
          break
        } catch {
          if (attempt === 2) {
            user.value = null
          } else {
            await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)))
          }
        }
      }
      ready.value = true
      pending = undefined
    })()
    return pending
  }

  /** Resolves once `/api/me` has answered at least once. */
  async function whenReady() {
    if (!ready.value) {
      await refresh()
    }
    return user.value
  }

  function callback(next?: string) {
    const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/account'
    return `${window.location.origin}${target}`
  }

  async function signInWith(provider: 'google' | 'github', next?: string) {
    const auth = await useAuthClient()
    const result = await auth.signIn.social({ provider, callbackURL: callback(next) })
    if (result?.error) {
      throw new Error(result.error.message || 'Sign-in failed')
    }
  }

  async function signInWithEmail(email: string, password: string) {
    const auth = await useAuthClient()
    const result = await auth.signIn.email({ email, password })
    if (result?.error) {
      throw new Error(result.error.message || 'That email and password did not match')
    }
    await refresh()
  }

  async function signUpWithEmail(name: string, email: string, password: string, next?: string) {
    const auth = await useAuthClient()
    const result = await auth.signUp.email({ name, email, password, callbackURL: callback(next) })
    if (result?.error) {
      throw new Error(result.error.message || 'Could not create the account')
    }
    await refresh()
  }

  async function signOut() {
    try {
      const auth = await useAuthClient()
      await auth.signOut()
    } finally {
      user.value = null
      await refresh()
    }
  }

  return {
    user,
    ready,
    authConfigured,
    loggedIn: computed(() => Boolean(user.value)),
    isAdmin: computed(() => Boolean(user.value?.isAdmin)),
    refresh,
    whenReady,
    signInWith,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }
}
