import React from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';

const Credentials: React.FC = () => {
  const { state } = useApp();

  if (!state.wallet.isConnected) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No wallet connected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please connect your wallet to view credentials.
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
    <div className="space-y-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            My Credentials
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your verifiable credentials
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link to="/issue" className="btn-primary flex items-center space-x-2">
            <PlusIcon className="h-4 w-4" />
            <span>Issue New Credential</span>
          </Link>
        </div>
      </div>

      {/* Credentials List */}
      <div className="card">
        {state.credentials.length > 0 ? (
          <div className="space-y-4">
            {state.credentials.map((credential) => (
              <div
                key={credential.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {Array.isArray(credential.type) 
                          ? credential.type.filter(t => t !== 'VerifiableCredential').join(', ')
                          : credential.type || 'Unknown Type'}
                      </h3>
                      {credential.is_revoked ? (
                        <span className="badge-error flex items-center space-x-1">
                          <XCircleIcon className="h-4 w-4" />
                          <span>Revoked</span>
                        </span>
                      ) : (
                        <span className="badge-success flex items-center space-x-1">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Valid</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Subject:</span>
                        <div className="font-medium text-gray-900">
                          {credential.credentialSubject?.name || 'Not specified'}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Issued:</span>
                        <div className="font-medium text-gray-900">
                          {credential.issued_at 
                            ? new Date(credential.issued_at * 1000).toLocaleDateString()
                            : credential.issuanceDate 
                              ? new Date(credential.issuanceDate).toLocaleDateString()
                              : 'Unknown'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Issuer:</span>
                        <div className="font-medium text-gray-900 font-mono text-xs">
                          {credential.issuer || 'Unknown'}
                        </div>
                      </div>
                      
                      {credential.credentialSubject?.birthYear && (
                        <div>
                          <span className="text-gray-500">Birth Year:</span>
                          <div className="font-medium text-gray-900">
                            {credential.credentialSubject.birthYear}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => console.log('View credential:', credential)}
                      className="text-gray-400 hover:text-gray-600"
                      title="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-4 flex space-x-3">
                  <Link
                    to="/generate"
                    className="btn-primary text-sm py-2 px-4"
                  >
                    Generate Proof
                  </Link>
                  <Link
                    to="/show-proof"
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Share as QR
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No credentials yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Issue your first verifiable credential to get started.
            </p>
            <div className="mt-6">
              <Link to="/issue" className="btn-primary">
                Issue Credential
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credentials;