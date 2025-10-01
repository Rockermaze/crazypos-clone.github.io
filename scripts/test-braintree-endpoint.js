// Test Braintree client-token endpoint functionality
// This simulates what the endpoint would do without starting the full server

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function testBraintreeClientToken() {
  try {
    console.log('Testing Braintree client token generation...');
    
    // Import and get gateway dynamically
    const { getGateway } = await import('../lib/braintree.js');
    const gateway = getGateway();
    
    // Test without customer ID (standard token)
    console.log('\n1. Testing standard client token generation:');
    const result = await gateway.clientToken.generate({});
    console.log('✓ Standard client token generated successfully');
    console.log(`  Token length: ${result.clientToken.length}`);
    
    // Test with customer ID (vault-aware token) 
    console.log('\n2. Testing vault-aware client token generation:');
    const vaultResult = await gateway.clientToken.generate({
      customerId: 'test-customer-id'
    });
    console.log('✓ Vault-aware client token generated successfully');
    console.log(`  Token length: ${vaultResult.clientToken.length}`);
    
    console.log('\n✅ All Braintree client token tests passed!');
    console.log('\nNext steps:');
    console.log('• Start the dev server: npm run dev');
    console.log('• Visit http://localhost:3000/dashboard');  
    console.log('• Sign in with your account');
    console.log('• Go to POS → Add items to cart → Choose "Card/PayPal/Google Pay (Braintree)"');
    console.log('• The Drop-in UI should load with a payment form');
    
  } catch (error) {
    console.error('❌ Braintree test failed:', error.message);
    
    if (error.message.includes('configuration incomplete')) {
      console.log('\n🔧 Configuration needed:');
      console.log('Add these to your .env.local file:');
      console.log('BRAINTREE_ENVIRONMENT=Sandbox');
      console.log('BRAINTREE_MERCHANT_ID=your_merchant_id');
      console.log('BRAINTREE_PUBLIC_KEY=your_public_key');
      console.log('BRAINTREE_PRIVATE_KEY=your_private_key');
    }
    
    process.exit(1);
  }
}

testBraintreeClientToken();