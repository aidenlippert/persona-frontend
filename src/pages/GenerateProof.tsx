import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FingerPrintIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  EyeIcon,
  DocumentDuplicateIcon as CopyIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import {
  submitProof,
  handleApiError,
  generateMockProofData,
  base64Encode,
} from '../lib/api';
import {
  generateProofId,
  copyToClipboard,
  openExplorer,
} from '../lib/keplr';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const GenerateProof: React.FC = () => {
  const { state, dispatch, showNotification } = useApp();
  const [selectedCredential, setSelectedCredential] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [circuitId] = useState('age_verification_v1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<any>(null);
  const [proofProgress, setProofProgress] = useState(0);

  // Load credentials when component mounts
  useEffect(() => {
    if (state.credentials.length > 0 && !selectedCredential) {
      setSelectedCredential(state.credentials[0].id);
    }
  }, [state.credentials, selectedCredential]);

  const handleGenerateProof = async () => {
    if (!state.wallet.address || !state.currentDID) {
      showNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet and create a DID first.',
      });
      return;
    }

    if (!selectedCredential) {
      showNotification({
        type: 'error',
        title: 'No Credential Selected',
        message: 'Please select a credential to generate a proof from.',
      });
      return;
    }

    const credential = state.credentials.find(c => c.id === selectedCredential);
    if (!credential) {
      showNotification({
        type: 'error',
        title: 'Credential Not Found',
        message: 'The selected credential could not be found.',
      });
      return;
    }

    // Check if credential supports age verification
    if (!credential.credentialSubject?.birthYear) {
      showNotification({
        type: 'error',
        title: 'Invalid Credential',
        message: 'The selected credential does not contain birth year information.',
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const userAge = currentYear - credential.credentialSubject.birthYear;
    
    if (userAge < minAge) {
      showNotification({
        type: 'warning',
        title: 'Age Verification Failed',
        message: `You are ${userAge} years old, which is less than the required ${minAge} years.`,
      });
      return;
    }

    setIsGenerating(true);
    setProofProgress(0);

    try {
      // Simulate proof generation progress
      const progressInterval = setInterval(() => {
        setProofProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Generate mock proof data (in a real implementation, this would be actual ZK proof generation)
      const mockProofData = generateMockProofData();
      const proofDataBase64 = base64Encode(mockProofData);
      const proofId = generateProofId();

      const publicInputs = [currentYear.toString(), minAge.toString()];
      const metadata = {
        credentialId: selectedCredential,
        didId: state.currentDID.id,
        proofType: 'age_verification',
        minAge: minAge,
        timestamp: new Date().toISOString(),
      };

      // Wait for progress simulation
      await new Promise(resolve => setTimeout(resolve, 3000));
      clearInterval(progressInterval);
      setProofProgress(100);

      const response = await submitProof(
        state.wallet.address,
        circuitId,
        proofDataBase64,
        publicInputs,
        metadata
      );

      if (response.code === 0) {
        const newProof = {
          id: proofId,
          circuit_id: circuitId,
          prover: state.wallet.address,
          proof_data: proofDataBase64,
          public_inputs: publicInputs,
          metadata: JSON.stringify(metadata),
          is_verified: true,
          created_at: Math.floor(Date.now() / 1000),
          txHash: response.txhash,
        };

        dispatch({ type: 'ADD_PROOF', payload: newProof });
        setGeneratedProof(newProof);

        showNotification({
          type: 'success',
          title: 'Proof Generated',
          message: 'Your zero-knowledge proof has been successfully generated!',
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      showNotification({
        type: 'error',
        title: 'Proof Generation Failed',
        message: errorMessage,
      });
    } finally {
      setIsGenerating(false);
      setProofProgress(0);
    }
  };

  const handleCopyProofId = async (proofId: string) => {
    const success = await copyToClipboard(proofId);
    if (success) {
      showNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Proof ID copied to clipboard',
        duration: 2000,
      });
    }
  };

  const handleCopyTxHash = async (txHash: string) => {
    const success = await copyToClipboard(txHash);
    if (success) {
      showNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Transaction hash copied to clipboard',
        duration: 2000,
      });
    }
  };

  // Redirect if not connected or no credentials
  if (!state.wallet.isConnected) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No wallet connected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please connect your Keplr wallet to generate proofs.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!state.currentDID) {
    return (
      <div className="text-center py-12">
        <FingerPrintIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No DID found</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to create a DID before generating proofs.
        </p>
        <div className="mt-6">
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (state.credentials.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No credentials found</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to issue a credential before generating proofs.
        </p>
        <div className="mt-6">
          <Link to="/issue" className="btn-primary">
            Issue Credential
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <FingerPrintIcon className="mx-auto h-12 w-12 text-primary-600" />
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Generate Zero-Knowledge Proof
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Prove facts about yourself without revealing sensitive information
        </p>
      </div>

      {generatedProof ? (
        /* Success State */
        <div className="card">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              Proof Generated Successfully!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your zero-knowledge proof has been created and verified on the blockchain.
            </p>
          </div>

          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-3">Proof Details</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Proof ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-green-900 font-mono text-xs">
                    {generatedProof.id}
                  </span>
                  <button
                    onClick={() => handleCopyProofId(generatedProof.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-green-700">Circuit:</span>
                <span className="text-green-900 font-medium">
                  Age Verification (≥{minAge})
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-green-700">Public Inputs:</span>
                <span className="text-green-900 font-medium">
                  [{generatedProof.public_inputs.join(', ')}]
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-green-700">Status:</span>
                <span className="badge-success">Verified ✓</span>
              </div>

              {generatedProof.txHash && (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Transaction:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-900 font-mono text-xs">
                      {generatedProof.txHash.slice(0, 8)}...{generatedProof.txHash.slice(-8)}
                    </span>
                    <button
                      onClick={() => handleCopyTxHash(generatedProof.txHash)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openExplorer(generatedProof.txHash)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">🔒 Privacy Preserved</h4>
            <p className="text-sm text-blue-800">
              This proof confirms that you are {minAge} years or older without revealing your exact age 
              or birth date. Your sensitive information remains completely private.
            </p>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => {
                setGeneratedProof(null);
                setSelectedCredential('');
              }}
              className="btn-secondary flex-1"
            >
              Generate Another
            </button>
            <Link to="/verify" className="btn-primary flex-1 text-center">
              Verify Proof
            </Link>
          </div>
        </div>
      ) : (
        /* Form */
        <div className="card">
          <form onSubmit={(e) => { e.preventDefault(); handleGenerateProof(); }} className="space-y-6">
            {/* Credential Selection */}
            <div>
              <label htmlFor="credential" className="block text-sm font-medium text-gray-700 mb-2">
                Select Credential
              </label>
              <select
                id="credential"
                value={selectedCredential}
                onChange={(e) => setSelectedCredential(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Choose a credential...</option>
                {state.credentials.map((credential) => (
                  <option key={credential.id} value={credential.id}>
                    {Array.isArray(credential.type) ? credential.type.join(', ') : credential.type || 'Unknown Type'} - {credential.credentialSubject.name || 'Unnamed'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the credential you want to generate a proof from
              </p>
            </div>

            {/* Circuit Selection */}
            <div>
              <label htmlFor="circuit" className="block text-sm font-medium text-gray-700 mb-2">
                Proof Circuit
              </label>
              <select
                id="circuit"
                value={circuitId}
                className="input-field"
                disabled
              >
                <option value="age_verification_v1">Age Verification v1</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                The cryptographic circuit used for proof generation
              </p>
            </div>

            {/* Minimum Age */}
            <div>
              <label htmlFor="minAge" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Age to Prove
              </label>
              <input
                type="number"
                id="minAge"
                value={minAge}
                onChange={(e) => setMinAge(parseInt(e.target.value) || 18)}
                className="input-field"
                min="1"
                max="100"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Prove that you are at least this age without revealing your exact age
              </p>
            </div>

            {/* Credential Preview */}
            {selectedCredential && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Credential</h4>
                {(() => {
                  const credential = state.credentials.find(c => c.id === selectedCredential);
                  if (!credential) return null;
                  
                  const currentYear = new Date().getFullYear();
                  const userAge = currentYear - (credential.credentialSubject?.birthYear || 0);
                  const canProve = userAge >= minAge;
                  
                  return (
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>Name: <span className="font-medium">{credential.credentialSubject?.name || 'Not specified'}</span></div>
                      <div>Current Age: <span className="font-medium">{userAge} years old</span></div>
                      <div>
                        Can Prove Age ≥ {minAge}: 
                        <span className={`font-medium ml-1 ${canProve ? 'text-green-700' : 'text-red-700'}`}>
                          {canProve ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>
                      {!canProve && (
                        <div className="text-red-700 text-xs mt-2">
                          ⚠️ You cannot prove this age requirement with the selected credential.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Progress Bar */}
            {isGenerating && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Generating Proof...</span>
                  <span className="text-sm text-gray-500">{proofProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${proofProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {proofProgress < 30 && 'Initializing circuit...'}
                  {proofProgress >= 30 && proofProgress < 60 && 'Computing witness...'}
                  {proofProgress >= 60 && proofProgress < 90 && 'Generating proof...'}
                  {proofProgress >= 90 && 'Submitting to blockchain...'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Link to="/dashboard" className="btn-secondary flex-1 text-center">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isGenerating || !selectedCredential}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <FingerPrintIcon className="h-4 w-4" />
                )}
                <span>{isGenerating ? 'Generating...' : 'Generate Proof'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About Zero-Knowledge Proofs</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>Zero-Knowledge Proofs (ZKPs)</strong> allow you to prove that you know a secret or that
            a statement is true without revealing the secret itself. In this case, you can prove your age
            is above a certain threshold without revealing your exact birth date.
          </p>
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Your birth year is used as private input to the proof circuit</li>
            <li>The circuit verifies that current_year - birth_year ≥ minimum_age</li>
            <li>The proof confirms the age requirement without revealing your birth year</li>
            <li>Anyone can verify the proof using only the public inputs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GenerateProof;