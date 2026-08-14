import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Better Auth's own tables only. The domain lives in Tensor-Core.
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    // Tensor-Core. Better Auth calls it when minting a token to resolve the
    // user's roles and permissions, which the backend owns.
    TENSOR_CORE_URL: z.string().url(),
    // Shared secret for that server-to-server call. Never sent to the browser.
    INTERNAL_API_SECRET: z.string().min(32),

    // --- SMTP -------------------------------------------------------------
    // Optional as a group: with none of it set, invitations still work and the
    // admin copies the link by hand. Mail is a convenience on top, never the
    // only way in — an outage must not stop people being onboarded.
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    SMTP_FROM_EMAIL: z.string().email().optional(),
    // Tensor-specific on purpose. The careers mailer shares this mailbox, and
    // an invite that grants a role must not arrive branded as recruiting.
    TENSOR_FROM_NAME: z.string().min(1).default('Optiminastic Tensor'),
    SMTP_REPLY_TO: z.string().email().optional(),

    // --- Shopify OAuth ----------------------------------------------------
    // Optional as a group: with the key/secret unset, "Connect with Shopify"
    // shows as not configured and brands are created by entering details by
    // hand. Set both (from one Partner Dashboard app) to enable the OAuth flow.
    SHOPIFY_API_KEY: z.string().min(1).optional(),
    SHOPIFY_API_SECRET: z.string().min(1).optional(),
    SHOPIFY_SCOPES: z.string().min(1).default('read_products'),
    // For a custom-distribution app: Shopify's pre-signed install link (from the
    // Partner Dashboard). When set, Connect redirects here (with our state)
    // instead of building the standard /admin/oauth/authorize URL.
    SHOPIFY_CUSTOM_APP_INSTALL_URL: z.string().url().optional(),

    // --- Google OAuth (Google Ads + Google Analytics) --------------------
    // Optional as a group: with the id/secret unset, the "Connect with Google"
    // buttons show as not configured and the connection can still be linked by
    // hand. Set both (one Google Cloud OAuth 2.0 client) to enable the flow.
    // The client's Authorized redirect URI must be
    // ${NEXT_PUBLIC_APP_URL}/api/google/oauth/callback.
    GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),

    // Seconds between automatic refreshes of the production pages. Unset (the
    // default) means no auto-refresh at all: every production page is a server
    // component fetched once, which is correct for a human-paced shop floor.
    // Set it while watching an automated run (cmd/simulator in Tensor-Core),
    // where state changes with nobody clicking anything. 10 is comfortable.
    NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS: z.coerce.number().int().min(2).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    TENSOR_CORE_URL: process.env.TENSOR_CORE_URL,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    TENSOR_FROM_NAME: process.env.TENSOR_FROM_NAME,
    SMTP_REPLY_TO: process.env.SMTP_REPLY_TO,
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES,
    SHOPIFY_CUSTOM_APP_INSTALL_URL: process.env.SHOPIFY_CUSTOM_APP_INSTALL_URL,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS: process.env.NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
