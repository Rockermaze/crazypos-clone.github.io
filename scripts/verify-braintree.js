#!/usr/bin/env node
/*
  Verifies Braintree client token generation using env vars from .env.local
  - Does NOT print the token itself; only confirms success and length.
*/
const path = require('path')
const fs = require('fs')
const braintree = require('braintree')

// Load env from .env.local if present
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
  console.log(`[verify-braintree] Loaded environment from ${envPath}`)
} else {
  console.log('[verify-braintree] No .env.local found; relying on process env')
}

function assertEnv(name) {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

function resolveEnvironment(raw) {
  const val = (raw || 'Sandbox').toString().trim().toLowerCase()
  if (val === 'production' || val === 'prod' || val === 'live') return braintree.Environment.Production
  return braintree.Environment.Sandbox
}

async function main() {
  try {
    const environment = resolveEnvironment(process.env.BRAINTREE_ENVIRONMENT)
    const merchantId = assertEnv('BRAINTREE_MERCHANT_ID')
    const publicKey = assertEnv('BRAINTREE_PUBLIC_KEY')
    const privateKey = assertEnv('BRAINTREE_PRIVATE_KEY')

    const gateway = new braintree.BraintreeGateway({
      environment,
      merchantId,
      publicKey,
      privateKey,
    })

    const result = await gateway.clientToken.generate({})
    if (!result || !result.clientToken) {
      throw new Error('No client token returned')
    }
    console.log(`[verify-braintree] Success. Client token length: ${result.clientToken.length}`)
    process.exit(0)
  } catch (err) {
    console.error('[verify-braintree] Failed:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

main()
