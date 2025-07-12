// Simple test script to verify credential API fix
const axios = require('axios');

async function testCredentialAPI() {
  console.log('🧪 Testing credential persistence fix...');
  
  try {
    // Test the credential issuance with correct format
    const credentialData = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'test-credential-' + Date.now(),
      type: ['VerifiableCredential', 'PersonalID'],
      issuer: 'cosmos1test123',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'cosmos1test123',
        name: 'Test User',
        birthYear: 1990
      }
    };

    const response = await axios.post('http://localhost:1317/cosmos/tx/v1beta1/txs', {
      tx: {
        body: {
          messages: [
            {
              '@type': '/persona.vc.v1.MsgIssueCredential',
              creator: 'cosmos1test123',
              vc_data: JSON.stringify(credentialData)
            }
          ]
        }
      }
    });

    console.log('✅ Credential issuance response:', response.data);

    // Wait a moment then check if it was stored
    setTimeout(async () => {
      try {
        const storedCreds = await axios.get('http://localhost:1317/persona/vc/v1beta1/credentials_by_controller/cosmos1test123');
        console.log('✅ Stored credentials:', storedCreds.data);
        
        if (storedCreds.data.vc_records && storedCreds.data.vc_records.length > 0) {
          console.log('🎉 Credential persistence WORKING!');
        } else {
          console.log('❌ Credential persistence FAILED!');
        }
      } catch (error) {
        console.error('❌ Error checking stored credentials:', error.response?.data || error.message);
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error testing credential API:', error.response?.data || error.message);
  }
}

testCredentialAPI();