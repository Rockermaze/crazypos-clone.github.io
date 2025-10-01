// Debug Braintree configuration
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Braintree Environment Variables:');
console.log('BRAINTREE_ENVIRONMENT:', process.env.BRAINTREE_ENVIRONMENT ? '✓ Set' : '❌ Missing');
console.log('BRAINTREE_MERCHANT_ID:', process.env.BRAINTREE_MERCHANT_ID ? '✓ Set' : '❌ Missing');
console.log('BRAINTREE_PUBLIC_KEY:', process.env.BRAINTREE_PUBLIC_KEY ? '✓ Set' : '❌ Missing');
console.log('BRAINTREE_PRIVATE_KEY:', process.env.BRAINTREE_PRIVATE_KEY ? '✓ Set' : '❌ Missing');

console.log('\nLoading Braintree gateway...');
try {
  const braintreeLib = require('../lib/braintree.js');
  console.log('Gateway status:', braintreeLib.gateway ? '✓ Initialized' : '❌ Not initialized');
} catch (error) {
  console.error('Gateway initialization error:', error.message);
}