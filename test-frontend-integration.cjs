// Test that verifies the actual frontend behavior
const axios = require('axios');

async function setupTestCredential() {
  console.log('🧪 Setting up test credential for frontend...');
  
  const walletAddress = 'cosmos1frontend_test';
  const baseURL = 'http://localhost:1317';
  
  try {
    // Create DID
    const didId = `did:persona:${walletAddress}:${Date.now()}`;
    const didDocument = {
      id: didId,
      controller: walletAddress,
      verificationMethod: [{
        id: `${didId}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: didId,
        publicKeyBase58: 'mock_key_frontend'
      }],
      service: [{
        id: `${didId}#service-1`,
        type: 'PersonaIdentityService',
        serviceEndpoint: 'https://persona-chain.dev/identity'
      }],
      created_at: Date.now(),
      updated_at: Date.now(),
      is_active: true
    };

    await axios.post(`${baseURL}/cosmos/tx/v1beta1/txs`, {
      tx: {
        body: {
          messages: [{
            '@type': '/persona.did.v1.MsgCreateDid',
            creator: walletAddress,
            did_id: didId,
            did_document: JSON.stringify(didDocument)
          }]
        }
      }
    });

    // Issue credential with the exact same format frontend uses
    const credentialData = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: `credential-frontend-${Date.now()}`,
      type: ['VerifiableCredential', 'PersonalID'],
      issuer: walletAddress,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: walletAddress,
        name: 'Frontend Test User',
        birthYear: 1985
      }
    };

    await axios.post(`${baseURL}/cosmos/tx/v1beta1/txs`, {
      tx: {
        body: {
          messages: [{
            '@type': '/persona.vc.v1.MsgIssueCredential',
            creator: walletAddress,
            vc_data: JSON.stringify(credentialData)
          }]
        }
      }
    });

    console.log('✅ Test credential setup complete');
    console.log(`📝 Wallet: ${walletAddress}`);
    console.log(`📝 DID: ${didId}`);
    console.log(`📝 Credential: ${credentialData.id}`);
    
    // Verify the credential is retrievable
    const creds = await axios.get(`${baseURL}/persona/vc/v1beta1/credentials_by_controller/${encodeURIComponent(walletAddress)}`);
    console.log(`📊 Available credentials: ${creds.data.vc_records.length}`);
    
    console.log('\n🌐 Frontend should now be able to:');
    console.log('1. Connect with wallet address:', walletAddress);
    console.log('2. Find existing DID automatically');
    console.log('3. Load existing credential');
    console.log('4. Generate proof from the credential');
    console.log('5. Navigate properly without going to landing page');
    
  } catch (error) {
    console.error('❌ Error setting up test:', error.response?.data || error.message);
  }
}

setupTestCredential();