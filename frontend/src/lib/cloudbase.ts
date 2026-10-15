import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV_ID || ''
const REGION = import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
const PUBLISH_KEY = import.meta.env.VITE_CLOUDBASE_PUBLISH_KEY || ''

const app = cloudbase.init({
  env: ENV_ID,
  region: REGION,
  accessKey: PUBLISH_KEY,
  auth: { detectSessionInUrl: true },
})

/**
 * Minimal structural type for the TCB auth instance.
 * The SDK ships its own (looser) types; this keeps our call sites type-safe
 * without resorting to `any` everywhere.
 */
interface AuthLike {
  getSession: () => Promise<{ data?: { session?: { access_token?: string; scope?: string } }; error?: unknown }>
  getUser: () => Promise<{ data?: { user?: TcbUser }; error?: unknown }>
  setSession: (session: { access_token: string; refresh_token: string }) => Promise<unknown>
  signOut: () => Promise<unknown>
  signInWithOtp: (params: { email: string }) => Promise<{ data?: unknown; error?: { message?: string } }>
  signInWithPassword: (params: { email: string; password: string }) => Promise<{ data?: unknown; error?: { message?: string } }>
  resetPasswordForEmail: (email: string) => Promise<{ data?: unknown; error?: { message?: string } }>
  resetPasswordForOld: (params: { old_password: string; new_password: string }) => Promise<{ data?: unknown; error?: { message?: string } }>
}

export interface TcbUser {
  id?: string
  email?: string
  is_anonymous?: boolean
  app_metadata?: { provider?: string }
  user_metadata?: { nickName?: string; name?: string; avatarUrl?: string }
}

export const auth = (app as unknown as { auth: () => unknown }).auth() as AuthLike

// IMPORTANT: must pass { database: 'public' } — TCB managed PostgreSQL uses the
// `public` schema. Without it the SDK uses envId as schema name → "Invalid schema".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = (app as any).rdb({ database: 'public' })

export default app

/** REST base for the TCB PG REST API (used by the rpc() helper). */
const REST_BASE = ENV_ID
  ? `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest`
  : ''

/**
 * Get the current user's access_token from the TCB session.
 * Returns empty string if not logged in.
 *
 * SDK v2 getSession() returns { data: { session: { access_token, ... }, user }, error }.
 * The token is nested under data.session.access_token (NOT data.access_token).
 */
export async function getAccessToken(): Promise<string> {
  try {
    const { data, error } = await auth.getSession()
    if (error || !data?.session?.access_token) return ''
    // Filter out accessKey-scoped tokens (anonymous sessions)
    if (data.session.scope === 'accessKey') return ''
    return data.session.access_token
  } catch {
    return ''
  }
}

/**
 * Resolve the token used for TCB REST calls.
 *
 * - Logged-in user  → their session access_token (RLS runs as `authenticated`)
 * - Logged-out user → the publishable key, which TCB accepts as an anonymous
 *   Bearer token (RLS runs as `anon`). Keeps public reads working without
 *   requiring anonymous sign-in to be enabled on the environment.
 */
export async function getRequestToken(): Promise<string> {
  const userToken = await getAccessToken()
  return userToken || PUBLISH_KEY
}

/**
 * Call a PostgreSQL function (RPC) via the TCB PG REST API.
 * @cloudbase/js-sdk@3.x has no db.rpc(), so we POST directly to the REST endpoint.
 */
export async function rpc<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {},
  options: { select?: string; order?: string; limit?: number; offset?: number } = {}
): Promise<T> {
  const token = await getRequestToken()
  const qs = new URLSearchParams()
  if (options.select) qs.set('select', options.select)
  if (options.order) qs.set('order', options.order)
  if (options.limit != null) qs.set('limit', String(options.limit))
  if (options.offset != null) qs.set('offset', String(options.offset))
  const query = qs.toString() ? `?${qs.toString()}` : ''

  const res = await fetch(`${REST_BASE}/rpc/${functionName}${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`RPC ${functionName} failed (${res.status}): ${text}`)
  }
  return (await res.json()) as T
}
