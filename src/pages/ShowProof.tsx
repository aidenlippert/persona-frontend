import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCodeIcon,
  ArrowLeftIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FingerPrintIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import QRCodeGenerator from '../components/QR/QRCodeGenerator';

interface SharedProofData {
  type: 'zk-proof';
  version: '1.0';
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

const ShowProof: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const [showQR, setShowQR] = useState(false);
  const [sharedData, setSharedData] = useState<SharedProofData | null>(null);

  const handleSelectProof = (proofId: string) => {
    const proof = state.proofs.find(p => p.id === proofId);
    if (!proof) return;

    // Find associated credential
    const credential = state.credentials.find(c => 
      c.credentialSubject?.id === state.currentDID?.id
    );

    // Create shareable data structure
    const shareData: SharedProofData = {
      type: 'zk-proof',
      version: '1.0',
      proof: proof,
      credential: credential ? {
        id: credential.id,
        type: credential.type,
        issuer: credential.issuer,
      } : undefined,
      timestamp: Date.now(),
    };

    setSharedData(shareData);
    setShowQR(true);
  };

  const resetView = () => {
    setShowQR(false);
    setSharedData(null);
  };

  const shareProofData = async () => {
    if (!sharedData) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ZK Proof Verification',
          text: 'Scan this QR code to verify my ZK proof',
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(JSON.stringify(sharedData, null, 2));
        alert('Proof data copied to clipboard!');
      }
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  // Check if user has DID and proofs
  if (!state.wallet.isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Wallet Not Connected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please connect your wallet to show proofs.
          </p>
        </div>
      </div>
    );
  }

  if (!state.currentDID) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No DID Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a DID first to generate and share proofs.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (state.proofs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Show My Proof</h1>
        </div>

        <div className="text-center py-12">
          <FingerPrintIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No Proofs Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate a ZK proof first to share it as a QR code.
          </p>
          <button
            onClick={() => navigate('/generate')}
            className="mt-4 btn-primary"
          >
            Generate Proof
          </button>
        </div>
      </div>
    );
  }

  if (showQR && sharedData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={resetView}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Share Proof QR Code</h1>
        </div>

        <div className="space-y-6">
          {/* Proof Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Proof Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Proof ID:</label>
                <p className="text-gray-900 font-mono text-xs break-all">
                  {sharedData.proof.id}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Circuit:</label>
                <p className="text-gray-900">{sharedData.proof.circuit_id}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Status:</label>
                <div className="flex items-center space-x-2">
                  {sharedData.proof.is_verified ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                  )}
                  <span className={sharedData.proof.is_verified ? 'text-green-700' : 'text-red-700'}>
                    {sharedData.proof.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700">Created:</label>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {new Date(sharedData.proof.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <QRCodeGenerator
              data={{
                url: `${window.location.origin}/scan-verify?data=${encodeURIComponent(JSON.stringify(sharedData))}`,
                type: 'verification-link',
                ...sharedData
              }}
              title="ZK Proof QR Code"
              subtitle="Others can scan this to verify your proof"
              size={280}
              className="mx-auto"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={shareProofData}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share Proof</span>
            </button>
            <button
              onClick={resetView}
              className="btn-secondary flex-1"
            >
              Choose Different Proof
            </button>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Security Notice:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• This QR code contains your ZK proof data</li>
              <li>• Share only with trusted parties</li>
              <li>• The proof doesn't reveal your private information</li>
              <li>• Verifiers can only confirm the proof's validity</li>
            </ul>
          </div>
        </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Show My Proof</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Share ZK Proofs via QR Code</h3>
          <p className="text-xs text-blue-800">
            Select a proof below to generate a QR code that others can scan to verify your credentials 
            without revealing your private information.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your ZK Proofs</h3>
          
          {state.proofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleSelectProof(proof.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <FingerPrintIcon className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Circuit: {proof.circuit_id}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(proof.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {proof.is_verified ? (
                    <div className="flex items-center space-x-1 text-green-700">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                  )}
                  <QrCodeIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShowProof;