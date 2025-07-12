import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCodeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FingerPrintIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import QRCodeScanner from '../components/QR/QRCodeScanner';
import LoadingSpinner from '../components/UI/LoadingSpinner';

interface SharedProofData {
  type: 'zk-proof';
  version: string;
  proof: {
    id: string;
    circuit_id: string;
    prover: string;
    proof_data: string;
    public_inputs: string[];
    metadata: string;
    is_verified: boolean;
    created_at: number;
  };
  credential?: {
    id: string;
    type: string[];
    issuer: string;
  };
  timestamp: number;
  signature?: string;
}

interface VerificationResult {
  isValid: boolean;
  proofData: SharedProofData | null;
  error?: string;
  warnings?: string[];
}

const ScanVerify: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check for URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    
    if (dataParam) {
      try {
        const proofData = JSON.parse(decodeURIComponent(dataParam));
        console.log('Processing proof data from URL:', proofData);
        verifyProofData(proofData);
      } catch (error) {
        console.error('Failed to parse URL proof data:', error);
        setVerificationResult({
          isValid: false,
          proofData: null,
          error: 'Invalid proof data in URL',
        });
      }
    }
  }, []);

  const handleScanResult = async (scanResult: any) => {
    if (!scanResult.success) {
      setVerificationResult({
        isValid: false,
        proofData: null,
        error: scanResult.error || 'Failed to scan QR code',
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      await verifyProofData(scanResult.data);
    } catch (error) {
      setVerificationResult({
        isValid: false,
        proofData: null,
        error: 'Verification process failed',
      });
    } finally {
      setIsVerifying(false);
      setIsScanning(false);
    }
  };

  const verifyProofData = async (data: any) => {
    // Add delay to simulate verification process
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      if (data.type !== 'zk-proof') {
        throw new Error('Not a valid ZK proof QR code');
      }

      if (!data.proof || !data.proof.id) {
        throw new Error('Missing proof data');
      }

      const proofData = data as SharedProofData;
      const warnings: string[] = [];

      // Check timestamp freshness (warn if older than 24 hours)
      const ageHours = (Date.now() - proofData.timestamp) / (1000 * 60 * 60);
      if (ageHours > 24) {
        warnings.push('This proof was generated more than 24 hours ago');
      }

      // Check proof age
      const proofAgeHours = (Date.now() - proofData.proof.created_at) / (1000 * 60 * 60);
      if (proofAgeHours > 168) { // 1 week
        warnings.push('The underlying proof is more than a week old');
      }

      // Simulate cryptographic verification
      // In a real implementation, this would involve:
      // 1. Verifying the ZK proof against the circuit
      // 2. Checking the proof signature
      // 3. Validating against blockchain records
      // 4. Verifying the credential issuer's signature
      
      const mockVerificationSuccess = Math.random() > 0.1; // 90% success rate for demo
      
      if (!mockVerificationSuccess) {
        throw new Error('Cryptographic verification failed');
      }

      setVerificationResult({
        isValid: true,
        proofData,
        warnings: warnings.length > 0 ? warnings : undefined,
      });

    } catch (error) {
      setVerificationResult({
        isValid: false,
        proofData: null,
        error: error instanceof Error ? error.message : 'Unknown verification error',
      });
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setIsScanning(false);
    setIsVerifying(false);
  };

  const startNewScan = () => {
    resetVerification();
    setIsScanning(true);
  };

  if (isVerifying) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Scan & Verify</h1>
        </div>

        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Verifying Proof...</h3>
          <p className="mt-2 text-sm text-gray-600">
            Checking cryptographic signatures and blockchain records
          </p>
        </div>
      </div>
    );
  }

  if (verificationResult) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Verification Result</h1>
        </div>

        <div className="space-y-6">
          {/* Verification Status */}
          <div className={`rounded-lg p-6 ${verificationResult.isValid 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {verificationResult.isValid ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              ) : (
                <XCircleIcon className="h-8 w-8 text-red-600 mr-3" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${verificationResult.isValid 
                  ? 'text-green-900' : 'text-red-900'
                }`}>
                  {verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}
                </h3>
                <p className={`text-sm ${verificationResult.isValid 
                  ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.isValid 
                    ? 'This ZK proof is cryptographically valid and verified'
                    : verificationResult.error || 'The proof could not be verified'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {verificationResult.warnings && verificationResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Warnings:</h4>
                  <ul className="mt-1 text-xs text-yellow-800 space-y-1">
                    {verificationResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Proof Details */}
          {verificationResult.isValid && verificationResult.proofData && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FingerPrintIcon className="h-5 w-5 mr-2" />
                Proof Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Proof ID:</label>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {verificationResult.proofData.proof.id}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Circuit:</label>
                  <p className="text-gray-900">{verificationResult.proofData.proof.circuit_id}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Prover:</label>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {verificationResult.proofData.proof.prover}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Created:</label>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {new Date(verificationResult.proofData.proof.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Status:</label>
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">Verified</span>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Public Inputs:</label>
                  <p className="text-gray-900">
                    {verificationResult.proofData.proof.public_inputs.length} inputs
                  </p>
                </div>
              </div>

              {/* Credential Info */}
              {verificationResult.proofData.credential && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold mb-3 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Associated Credential
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Type:</label>
                      <p className="text-gray-900">
                        {verificationResult.proofData.credential.type.join(', ')}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Issuer:</label>
                      <p className="text-gray-900 font-mono text-xs break-all">
                        {verificationResult.proofData.credential.issuer}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={startNewScan}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <QrCodeIcon className="h-4 w-4" />
              <span>Scan Another Proof</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isScanning) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setIsScanning(false)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        </div>

        <QRCodeScanner
          onScan={handleScanResult}
          onClose={() => setIsScanning(false)}
          expectedDataSchema={['type', 'proof', 'timestamp']}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Scan & Verify</h1>
      </div>

      <div className="space-y-6">
        {/* Hero Section */}
        <div className="text-center py-8">
          <QrCodeIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verify ZK Proofs
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Scan a QR code to verify someone's Zero-Knowledge proof and validate their credentials 
            without accessing their private information.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Ask the credential holder to show their proof QR code</li>
            <li>Tap "Start Camera" below to begin scanning</li>
            <li>Point your camera at the QR code</li>
            <li>Wait for automatic verification to complete</li>
            <li>View the verification result and proof details</li>
          </ol>
        </div>

        {/* Start Scanning Button */}
        <div className="text-center">
          <button
            onClick={() => setIsScanning(true)}
            className="btn-primary text-lg px-8 py-4 flex items-center space-x-3 mx-auto"
          >
            <QrCodeIcon className="h-6 w-6" />
            <span>Start Camera</span>
          </button>
        </div>

        {/* Security Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">Privacy & Security:</h3>
          <ul className="text-xs text-green-800 space-y-1">
            <li>• Zero-Knowledge proofs reveal no private information</li>
            <li>• Only the validity of claims is verified</li>
            <li>• No personal data is stored or transmitted</li>
            <li>• Cryptographic verification ensures authenticity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScanVerify;