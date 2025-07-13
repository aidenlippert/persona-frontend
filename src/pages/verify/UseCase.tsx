import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  UserIcon,
  ShareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

interface UseCase {
  name: string;
  description: string;
  requirements: string[];
  icon: string;
}

interface CredentialTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

interface RequirementStatus {
  templateId: string;
  status: 'pending' | 'loading' | 'verified' | 'failed';
  credential?: any;
  error?: string;
}

const UseCaseVerify: React.FC = () => {
  const { useCase: useCaseKey } = useParams<{ useCase: string }>();
  const { showNotification } = useApp();
  
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [templates, setTemplates] = useState<{ [key: string]: CredentialTemplate }>({});
  const [lookupDid, setLookupDid] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [requirementStatuses, setRequirementStatuses] = useState<{ [key: string]: RequirementStatus }>({});
  const [loading, setLoading] = useState(true);
  const [fetchingRequirements, setFetchingRequirements] = useState(false);

  // Load use case and template data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load use cases
        const useCasesData = await import('../../data/use-cases.json');
        const foundUseCase = (useCasesData.default as any)[useCaseKey || ''];
        
        if (!foundUseCase) {
          showNotification({
            type: 'error',
            title: 'Use Case Not Found',
            message: `Use case "${useCaseKey}" was not found.`,
          });
          return;
        }

        setUseCase(foundUseCase);

        // Load templates
        const templatesData = await import('../../data/credential-templates.json');
        const templateMap: { [key: string]: CredentialTemplate } = {};
        templatesData.default.forEach((template: CredentialTemplate) => {
          templateMap[template.id] = template;
        });
        setTemplates(templateMap);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        showNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load verification data',
        });
        setLoading(false);
      }
    };

    if (useCaseKey) {
      loadData();
    }
  }, [useCaseKey, showNotification]);

  const handleFetchRequirements = async () => {
    if (!lookupDid.trim()) {
      showNotification({
        type: 'error',
        title: 'Invalid Input',
        message: 'Please enter a valid DID.',
      });
      return;
    }

    setFetchingRequirements(true);
    
    try {
      // Simulate API call to get requirements
      // In real implementation, this would call the backend API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, use the requirements from the use case definition
      const reqs = useCase?.requirements || [];
      setRequirements(reqs);
      
      // Initialize requirement statuses
      const statuses: { [key: string]: RequirementStatus } = {};
      reqs.forEach(req => {
        statuses[req] = {
          templateId: req,
          status: 'pending',
        };
      });
      setRequirementStatuses(statuses);

      showNotification({
        type: 'success',
        title: 'Requirements Fetched',
        message: `Found ${reqs.length} required credentials for this use case.`,
      });
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
      showNotification({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch requirements for the specified DID.',
      });
    } finally {
      setFetchingRequirements(false);
    }
  };

  const handleShareCredential = async (templateId: string) => {
    setRequirementStatuses(prev => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        status: 'loading',
      },
    }));

    try {
      // Simulate fetching and verifying the credential
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate API calls to /api/getVc and /api/verifyProof
      const randomSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      if (randomSuccess) {
        // Mock credential data
        const mockCredential = {
          id: `credential_${templateId}_${Date.now()}`,
          type: templates[templateId]?.title || 'Unknown',
          issuanceDate: new Date().toISOString(),
          verified: true,
        };

        setRequirementStatuses(prev => ({
          ...prev,
          [templateId]: {
            templateId,
            status: 'verified',
            credential: mockCredential,
          },
        }));

        showNotification({
          type: 'success',
          title: 'Credential Verified',
          message: `${templates[templateId]?.title || templateId} credential verified successfully.`,
        });
      } else {
        setRequirementStatuses(prev => ({
          ...prev,
          [templateId]: {
            templateId,
            status: 'failed',
            error: 'Credential verification failed or expired',
          },
        }));

        showNotification({
          type: 'error',
          title: 'Verification Failed',
          message: `Failed to verify ${templates[templateId]?.title || templateId} credential.`,
        });
      }
    } catch (error) {
      console.error('Failed to share credential:', error);
      setRequirementStatuses(prev => ({
        ...prev,
        [templateId]: {
          templateId,
          status: 'failed',
          error: 'Network error occurred',
        },
      }));

      showNotification({
        type: 'error',
        title: 'Share Failed',
        message: 'Failed to share credential.',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'loading':
        return <LoadingSpinner size="sm" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const allRequirementsMet = requirements.length > 0 && 
    requirements.every(req => requirementStatuses[req]?.status === 'verified');

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading verification details...</p>
      </div>
    );
  }

  if (!useCase) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Use case not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested verification use case could not be found.
        </p>
        <div className="mt-6">
          <Link to="/verify" className="btn-primary">
            Back to Verification Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">{useCase.icon}</div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          {useCase.name} Verification
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {useCase.description}
        </p>
        <div className="mt-4">
          <Link
            to="/verify"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Verification Center
          </Link>
        </div>
      </div>

      {/* DID Lookup */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Step 1: Enter DID to Verify
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter DID (e.g., did:persona:123abc...)"
                value={lookupDid}
                onChange={(e) => setLookupDid(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <button
            onClick={handleFetchRequirements}
            disabled={fetchingRequirements || !lookupDid.trim()}
            className="btn-primary flex items-center space-x-2"
          >
            {fetchingRequirements ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <ShieldCheckIcon className="h-4 w-4" />
            )}
            <span>Fetch Requirements</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Enter the DID of the person whose credentials you want to verify
        </p>
      </div>

      {/* Requirements */}
      {requirements.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Step 2: Required Credentials ({requirements.length})
          </h3>
          <div className="space-y-3">
            {requirements.map((templateId) => {
              const template = templates[templateId];
              const status = requirementStatuses[templateId];
              
              if (!template) {
                return (
                  <div key={templateId} className="p-3 border rounded-lg bg-red-50 border-red-200">
                    <div className="text-sm text-red-800">
                      Template "{templateId}" not found
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={templateId}
                  className={`p-4 border rounded-lg transition-colors ${getStatusColor(status?.status || 'pending')}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        {status?.error && (
                          <p className="text-sm text-red-600 mt-1">{status.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status?.status || 'pending')}
                      {status?.status === 'pending' && (
                        <button
                          onClick={() => handleShareCredential(templateId)}
                          className="btn-secondary btn-sm flex items-center space-x-1"
                        >
                          <ShareIcon className="h-4 w-4" />
                          <span>Share</span>
                        </button>
                      )}
                      {status?.status === 'failed' && (
                        <button
                          onClick={() => handleShareCredential(templateId)}
                          className="btn-secondary btn-sm flex items-center space-x-1"
                        >
                          <ShareIcon className="h-4 w-4" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {status?.credential && (
                    <div className="mt-3 p-3 bg-green-100 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>✓ Verified:</strong> Credential verified successfully
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        ID: {status.credential.id}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verification Result */}
      {allRequirementsMet && (
        <div className="card bg-green-50 border-green-200">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-2 text-lg font-semibold text-green-900">
              Verification Complete!
            </h3>
            <p className="mt-1 text-sm text-green-700">
              All required credentials have been verified successfully for {useCase.name}.
            </p>
          </div>
          
          <div className="mt-6 bg-green-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">Verification Summary</h4>
            <div className="space-y-1 text-sm text-green-800">
              <div>DID: <span className="font-mono">{lookupDid}</span></div>
              <div>Use Case: {useCase.name}</div>
              <div>Verified Credentials: {requirements.length}</div>
              <div>Verification Time: {new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Verification Process</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            This verification process uses zero-knowledge proofs to validate credentials
            without exposing sensitive personal information.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <strong>✓ Privacy Protected:</strong>
              <div className="text-xs mt-1">
                Only necessary information is revealed through ZK proofs
              </div>
            </div>
            <div>
              <strong>✓ Cryptographically Secure:</strong>
              <div className="text-xs mt-1">
                All credentials are tamper-evident and verifiable
              </div>
            </div>
            <div>
              <strong>✓ Real-time Verification:</strong>
              <div className="text-xs mt-1">
                Instant validation through blockchain verification
              </div>
            </div>
            <div>
              <strong>✓ Standardized Process:</strong>
              <div className="text-xs mt-1">
                Compatible across different platforms and services
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCaseVerify;