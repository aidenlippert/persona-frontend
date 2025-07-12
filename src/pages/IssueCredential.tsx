import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import {
  issueCredential,
  handleApiError,
} from '../lib/api';
import {
  generateCredentialId,
} from '../lib/keplr';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const IssueCredential: React.FC = () => {
  const { state, dispatch, showNotification } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    birthYear: new Date().getFullYear() - 25,
    credentialType: 'ProofOfAge',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCredential, setSubmittedCredential] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'birthYear' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.wallet.address || !state.currentDID) {
      showNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet and create a DID first.',
      });
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      showNotification({
        type: 'error',
        title: 'Invalid Input',
        message: 'Please enter your name.',
      });
      return;
    }

    if (formData.birthYear < 1900 || formData.birthYear > new Date().getFullYear()) {
      showNotification({
        type: 'error',
        title: 'Invalid Birth Year',
        message: 'Please enter a valid birth year.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const credentialId = generateCredentialId();
      const currentYear = new Date().getFullYear();
      const age = currentYear - formData.birthYear;
      
      const claims = {
        name: formData.name,
        birthYear: formData.birthYear,
        age: age,
        isOver18: age >= 18,
        isOver21: age >= 21,
        countryOfBirth: 'United States', // Default for demo
        issuanceDate: new Date().toISOString(),
      };

      const response = await issueCredential(
        'did:persona:testnet-issuer-authority', // Issuer DID
        credentialId,
        formData.credentialType,
        state.currentDID.id,
        claims
      );

      if (response.code === 0) {
        const newCredential = {
          id: credentialId,
          type: ['VerifiableCredential', formData.credentialType],
          issuer: 'did:persona:testnet-issuer-authority',
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: state.currentDID.id,
            ...claims,
          },
          is_revoked: false,
          issued_at: Math.floor(Date.now() / 1000),
        };

        dispatch({ type: 'ADD_CREDENTIAL', payload: newCredential });
        setSubmittedCredential(newCredential);

        showNotification({
          type: 'success',
          title: 'Credential Issued',
          message: 'Your verifiable credential has been successfully issued!',
        });

        // Reset form
        setFormData({
          name: '',
          birthYear: new Date().getFullYear() - 25,
          credentialType: 'ProofOfAge',
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      showNotification({
        type: 'error',
        title: 'Credential Issuance Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to dashboard if not connected or no DID
  if (!state.wallet.isConnected) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No wallet connected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please connect your Keplr wallet to issue credentials.
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
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No DID found</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to create a DID before issuing credentials.
        </p>
        <div className="mt-6">
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-primary-600" />
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Issue Verifiable Credential
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Create a tamper-proof credential that can be verified by anyone
        </p>
      </div>

      {submittedCredential ? (
        /* Success State */
        <div className="card">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              Credential Issued Successfully!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your verifiable credential has been created and stored on the blockchain.
            </p>
          </div>

          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-3">Credential Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Type:</span>
                <span className="text-green-900 font-medium">
                  {Array.isArray(submittedCredential.type) ? submittedCredential.type.join(', ') : submittedCredential.type || 'Unknown Type'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Subject:</span>
                <span className="text-green-900 font-mono text-xs">
                  {submittedCredential.credentialSubject.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Name:</span>
                <span className="text-green-900 font-medium">
                  {submittedCredential.credentialSubject.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Age Verification:</span>
                <span className="text-green-900">
                  {submittedCredential.credentialSubject.isOver18 ? '18+' : 'Under 18'}
                  {submittedCredential.credentialSubject.isOver21 ? ', 21+' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => {
                setSubmittedCredential(null);
              }}
              className="btn-secondary flex-1"
            >
              Issue Another
            </button>
            <Link to="/proof" className="btn-primary flex-1 text-center">
              Generate Proof
            </Link>
          </div>
        </div>
      ) : (
        /* Form */
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Credential Type */}
            <div>
              <label htmlFor="credentialType" className="block text-sm font-medium text-gray-700 mb-2">
                Credential Type
              </label>
              <select
                id="credentialType"
                name="credentialType"
                value={formData.credentialType}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="ProofOfAge">Proof of Age</option>
                <option value="ProofOfIdentity">Proof of Identity</option>
                <option value="ProofOfResidency">Proof of Residency</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the type of credential you want to issue
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="inline h-4 w-4 mr-1" />
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter your full name"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be included in your verifiable credential
              </p>
            </div>

            {/* Birth Year */}
            <div>
              <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Birth Year
              </label>
              <input
                type="number"
                id="birthYear"
                name="birthYear"
                value={formData.birthYear}
                onChange={handleInputChange}
                className="input-field"
                min="1900"
                max={new Date().getFullYear()}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Used for age verification without revealing exact date
              </p>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Name: <span className="font-medium">{formData.name || 'Not specified'}</span></div>
                <div>
                  Age: <span className="font-medium">
                    {new Date().getFullYear() - formData.birthYear} years old
                  </span>
                </div>
                <div>
                  Age Verification: <span className="font-medium">
                    {new Date().getFullYear() - formData.birthYear >= 18 ? '18+' : 'Under 18'}
                    {new Date().getFullYear() - formData.birthYear >= 21 ? ', 21+' : ''}
                  </span>
                </div>
                <div>Type: <span className="font-medium">{formData.credentialType}</span></div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">🔒 Privacy Notice</h4>
              <p className="text-sm text-yellow-800">
                Your personal information will be stored in a verifiable credential on the blockchain.
                You can later generate zero-knowledge proofs to verify facts about yourself without
                revealing the underlying data.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Link to="/dashboard" className="btn-secondary flex-1 text-center">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <DocumentTextIcon className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Issuing...' : 'Issue Credential'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About Verifiable Credentials</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>Verifiable Credentials (VCs)</strong> are tamper-evident credentials that can be verified
            cryptographically. They provide a way to represent information about a subject (you) in a way
            that is verifiable and privacy-preserving.
          </p>
          <p>
            <strong>Key Features:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Cryptographically secure and tamper-evident</li>
            <li>Self-sovereign - you control your credentials</li>
            <li>Privacy-preserving - reveal only what's necessary</li>
            <li>Interoperable across different platforms</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IssueCredential;