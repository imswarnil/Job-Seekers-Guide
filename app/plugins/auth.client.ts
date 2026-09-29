/**
 * On every page load, find out who is signed in.
 *
 * After Google (or any OAuth provider) Neon Auth sends the reader back here with
 * `?neon_auth_session_verifier=…`. The SDK's `getSession()` trades that for the
 * session cookie through our `/api/auth` proxy and strips the parameter from
 * the address bar; only then is `/api/me` asked.
 */
export default defineNuxtPlugin(() => {
  const { refresh } = useUser()

  const url = new URL(window.location.href)
  if (url.searchParams.has('neon_auth_session_verifier')) {
    useAuthClient()
      .then(auth => auth.getSession())
      .catch(() => {})
      .finally(() => refresh())
    return
  }

  refresh()
})
