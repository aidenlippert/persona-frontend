// Test the actual user flow that's failing
const axios = require('axios');

async function testUserFlow() {
  console.log('🧪 Testing complete user flow...');
  
  const walletAddress = 'cosmos1test123';
  const baseURL = 'http://localhost:1317';
  
  try {
    // Step 1: Create DID (simulate what frontend does)
    console.log('📝 Step 1: Creating DID...');
    const didId = `did:persona:${walletAddress}:${Date.now()}`;
    const didDocument = {
      id: didId,
      controller: walletAddress,
      verificationMethod: [{
        id: `${didId}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: didId,
        publicKeyBase58: 'mock_key_123'
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

    const didResponse = await axios.post(`${baseURL}/cosmos/tx/v1beta1/txs`, {
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
    console.log('✅ DID created:', didResponse.data.txhash);

    // Step 2: Issue credential (simulate what fixed frontend does)
    console.log('📝 Step 2: Issuing credential...');
    const credentialData = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: `credential-${Date.now()}`,
      type: ['VerifiableCredential', 'PersonalID'],
      issuer: walletAddress,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: walletAddress,
        name: 'Test User',
        birthYear: 1990
      }
    };

    const credResponse = await axios.post(`${baseURL}/cosmos/tx/v1beta1/txs`, {
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
    console.log('✅ Credential issued:', credResponse.data.txhash);

    // Step 3: Wait and check if credential persists
    console.log('📝 Step 3: Checking credential persistence...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const storedCreds = await axios.get(`${baseURL}/persona/vc/v1beta1/credentials_by_controller/${encodeURIComponent(walletAddress)}`);
    console.log('📊 Stored credentials:', JSON.stringify(storedCreds.data, null, 2));

    if (storedCreds.data.vc_records && storedCreds.data.vc_records.length > 0) {
      console.log('🎉 SUCCESS: Credential persistence is working!');
      
      // Step 4: Check if credential can be used for proof generation
      const credential = storedCreds.data.vc_records[0];
      if (credential.credentialSubject && credential.credentialSubject.birthYear) {
        console.log('✅ Credential has birthYear, can generate age proof');
        
        // Simulate submitting proof
        const proofData = {
          pi_a: ['mock1', 'mock2', '1'],
          pi_b: [['mock3', 'mock4'], ['mock5', 'mock6'], ['1', '0']],
          pi_c: ['mock7', 'mock8', '1'],
          protocol: 'groth16',
          curve: 'bn128'
        };

        const proofResponse = await axios.post(`${baseURL}/cosmos/tx/v1beta1/txs`, {
          tx: {
            body: {
              messages: [{
                '@type': '/persona.zk.v1.MsgSubmitProof',
                creator: walletAddress,
                circuit_id: 'age_verification_v1',
                proof: JSON.stringify(proofData),
                public_inputs: ['2025', '18'],
                metadata: JSON.stringify({
                  credentialId: credential.id,
                  didId: didId,
                  proofType: 'age_verification',
                  minAge: 18
                })
              }]
            }
          }
        });
        console.log('✅ Proof submitted:', proofResponse.data.txhash);

        // Check if proof persists
        const storedProofs = await axios.get(`${baseURL}/persona/zk/v1beta1/proofs_by_controller/${encodeURIComponent(walletAddress)}`);
        console.log('📊 Stored proofs:', storedProofs.data);
        
        if (storedProofs.data.zk_proofs && storedProofs.data.zk_proofs.length > 0) {
          console.log('🎉 SUCCESS: Complete flow working - credentials and proofs persist!');
        } else {
          console.log('❌ ISSUE: Proofs not persisting');
        }
      } else {
        console.log('❌ ISSUE: Credential missing birthYear for proof generation');
      }
    } else {
      console.log('❌ FAILURE: Credential persistence not working');
    }

    // Step 5: Test DID lookup by controller
    console.log('📝 Step 5: Testing DID lookup by controller...');
    const didLookup = await axios.get(`${baseURL}/persona/did/v1beta1/did_by_controller/${encodeURIComponent(walletAddress)}`);
    console.log('📊 DID lookup result:', didLookup.data);
    
    if (didLookup.data.did_document) {
      console.log('✅ DID persistence working');
    } else {
      console.log('❌ DID persistence failing');
    }

  } catch (error) {
    console.error('❌ Error in user flow test:', error.response?.data || error.message);
  }
}

testUserFlow();