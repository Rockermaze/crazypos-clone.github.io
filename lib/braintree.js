import braintree from 'braintree'

function resolveEnvironment(raw) {
  const val = (raw || 'Sandbox').toString().trim().toLowerCase()
  if (val === 'production' || val === 'prod' || val === 'live') return braintree.Environment.Production
  if (val === 'sandbox' || val === 'sbx' || val === 'test' || val === '') return braintree.Environment.Sandbox
  // Default to Sandbox but warn
  console.warn(`[Braintree] Unknown BRAINTREE_ENVIRONMENT="${raw}". Defaulting to Sandbox.`)
  return braintree.Environment.Sandbox
}

function assertEnv(name) {
  const value = process.env[name]
  if (!value) {
    // Throwing makes the failure explicit at call sites
    throw new Error(`[Braintree] Missing required env var: ${name}`)
  }
  return value
}

// Lazily create the gateway so that unit tests and builds that read this file
// don’t immediately throw if env isn’t populated until runtime.
let _gateway = null
export function getGateway() {
  if (_gateway) return _gateway
  const env = resolveEnvironment(process.env.BRAINTREE_ENVIRONMENT)
  const merchantId = assertEnv('BRAINTREE_MERCHANT_ID')
  const publicKey = assertEnv('BRAINTREE_PUBLIC_KEY')
  const privateKey = assertEnv('BRAINTREE_PRIVATE_KEY')

  _gateway = new braintree.BraintreeGateway({
    environment: env,
    merchantId,
    publicKey,
    privateKey,
  })
  return _gateway
}

export default getGateway()
