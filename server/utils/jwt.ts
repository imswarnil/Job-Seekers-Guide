/**
 * Verify a Neon Auth JWT against the project's JWKS, with WebCrypto only.
 *
 * Neon Auth (Better Auth's JWT plugin) signs with EdDSA (Ed25519) by default;
 * RS256 and ES256 are accepted too in case the project is configured that way.
 * Keys are cached per isolate for ten minutes and refetched once when a token
 * names a key id we have not seen, which is how a key rotation looks.
 */

interface Jwk extends JsonWebKey {
  kid?: string
  alg?: string
}

export interface JwtClaims {
  sub?: string
  id?: string
  email?: string
  name?: string
  image?: string | null
  exp?: number
  nbf?: number
  [key: string]: unknown
}

const cache = new Map<string, { at: number, keys: Jwk[] }>()
const TTL = 10 * 60 * 1000

async function loadKeys(jwksUrl: string, force = false): Promise<Jwk[]> {
  const hit = cache.get(jwksUrl)
  if (hit && !force && Date.now() - hit.at < TTL) {
    return hit.keys
  }
  const response = await fetch(jwksUrl, { headers: { accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`JWKS fetch failed with ${response.status}`)
  }
  const body = await response.json() as { keys?: Jwk[] }
  const keys = Array.isArray(body.keys) ? body.keys : []
  cache.set(jwksUrl, { at: Date.now(), keys })
  return keys
}

function b64urlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function algorithmFor(alg: string, jwk: Jwk): { importAlg: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams, verifyAlg: AlgorithmIdentifier | EcdsaParams } | null {
  if (alg === 'EdDSA' || alg === 'Ed25519') {
    if (jwk.crv !== 'Ed25519') {
      return null
    }
    return { importAlg: { name: 'Ed25519' }, verifyAlg: { name: 'Ed25519' } }
  }
  if (alg === 'RS256') {
    return { importAlg: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, verifyAlg: { name: 'RSASSA-PKCS1-v1_5' } }
  }
  if (alg === 'ES256') {
    return { importAlg: { name: 'ECDSA', namedCurve: 'P-256' }, verifyAlg: { name: 'ECDSA', hash: 'SHA-256' } }
  }
  return null
}

/** The claims of a valid, unexpired token; null for anything else. Never throws. */
export async function verifyJwt(token: string, jwksUrl: string): Promise<JwtClaims | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    const [headerPart, payloadPart, signaturePart] = parts as [string, string, string]
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(headerPart))) as { alg?: string, kid?: string }
    if (!header.alg || header.alg === 'none') {
      return null
    }

    const find = (keys: Jwk[]) => keys.find(k => (header.kid ? k.kid === header.kid : true) && (!k.alg || k.alg === header.alg))
    let jwk = find(await loadKeys(jwksUrl))
    if (!jwk && header.kid) {
      jwk = find(await loadKeys(jwksUrl, true))
    }
    if (!jwk) {
      return null
    }

    const algorithm = algorithmFor(header.alg, jwk)
    if (!algorithm) {
      return null
    }
    const { kid: _kid, alg: _alg, ...material } = jwk
    const key = await crypto.subtle.importKey('jwk', material, algorithm.importAlg, false, ['verify'])
    const valid = await crypto.subtle.verify(
      algorithm.verifyAlg,
      key,
      b64urlToBytes(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    )
    if (!valid) {
      return null
    }

    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadPart))) as JwtClaims
    const now = Math.floor(Date.now() / 1000)
    if (typeof claims.exp === 'number' && claims.exp < now - 30) {
      return null
    }
    if (typeof claims.nbf === 'number' && claims.nbf > now + 30) {
      return null
    }
    return claims
  } catch {
    return null
  }
}
