import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentDuplicateIcon as CopyIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import {
  listDIDs,
  listCredentials,
  listProofs,
  createDID,
  getDIDByController,
  getCredentialsByController,
  getProofsByController,
  handleApiError,
} from '../lib/api';
import {
  generateDIDId,
  formatAddress,
  copyToClipboard,
  openExplorer,
} from '../lib/keplr';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';

const Dashboard: React.FC = () => {
  const { state, dispatch, showNotification, refreshBalance } = useApp();
  const [loading, setLoading] = useState(false);
  const [showCreateDID, setShowCreateDID] = useState(false);
  const [creatingDID, setCreatingDID] = useState(false);

  // Load data on component mount and wallet connection
  useEffect(() => {
    if (state.wallet.isConnected) {
      loadDashboardData();
      refreshBalance();
    }
  }, [state.wallet.isConnected]);

  // Close create DID modal if a DID is created
  useEffect(() => {
    if (state.currentDID && showCreateDID) {
      setShowCreateDID(false);
    }
  }, [state.currentDID]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load DIDs, credentials, and proofs in parallel
      const [didsResponse, credentialsResponse, proofsResponse] = await Promise.allSettled([
        listDIDs(),
        listCredentials(),
        listProofs(),
      ]);

      let userDID = null;

      // Handle DIDs first to get the current DID
      if (didsResponse.status === 'fulfilled') {
        console.log('🔍 Raw DIDs response:', didsResponse.value);
        console.log('🔍 Looking for controller:', state.wallet.address);
        const allDIDs = didsResponse.value.did_documents || [];
        console.log('🔍 All DIDs:', allDIDs);
        userDID = allDIDs.find(
          (did) => did.controller === state.wallet.address
        );
        console.log('🔍 Found user DID from API:', userDID);
        
        // If no DID found from API, try direct controller lookup
        if (!userDID && state.wallet.address) {
          console.log('🔍 No DID from list API, trying controller lookup for:', state.wallet.address);
          try {
            const controllerDID = await getDIDByController(state.wallet.address);
            if (controllerDID) {
              console.log('🔍 Found DID via controller lookup:', controllerDID);
              userDID = controllerDID;
            }
          } catch (error) {
            console.warn('Controller DID lookup failed:', error);
          }
        }
        
        // If still no DID found from API, preserve the one from localStorage
        if (!userDID && state.currentDID) {
          console.log('🔍 No DID from API, keeping localStorage DID:', state.currentDID);
          userDID = state.currentDID;
        }
        
        dispatch({ type: 'SET_CURRENT_DID', payload: userDID || null });
      } else {
        // If API call failed, keep the localStorage DID
        console.log('🔍 DID API call failed, keeping localStorage DID:', state.currentDID);
        userDID = state.currentDID;
      }

      // Handle Credentials - now use the userDID we just found
      if (credentialsResponse.status === 'fulfilled') {
        console.log('🔍 Raw credentials response:', credentialsResponse.value);
        const allCredentials = credentialsResponse.value.vc_records || [];
        console.log('🔍 All credentials:', allCredentials);
        // Filter credentials that belong to the current user
        let userCredentials = allCredentials.filter(cred => 
          cred.credentialSubject?.id === userDID?.id ||
          cred.credentialSubject?.id?.includes(state.wallet.address || '')
        );
        
        // If no credentials found and we have a wallet address, try controller-specific lookup
        if (userCredentials.length === 0 && state.wallet.address) {
          try {
            console.log('🔍 No credentials from list API, trying controller lookup');
            const controllerCreds = await getCredentialsByController(state.wallet.address);
            userCredentials = controllerCreds.vc_records || [];
            console.log('🔍 Found credentials via controller lookup:', userCredentials);
          } catch (error) {
            console.warn('Controller credentials lookup failed:', error);
          }
        }
        
        console.log('🔍 Final user credentials:', userCredentials);
        dispatch({
          type: 'SET_CREDENTIALS',
          payload: userCredentials,
        });
      }

      // Handle Proofs
      if (proofsResponse.status === 'fulfilled') {
        console.log('🔍 Raw proofs response:', proofsResponse.value);
        const allProofs = proofsResponse.value.zk_proofs || [];
        console.log('🔍 All proofs:', allProofs);
        // Filter proofs that belong to the current user
        let userProofs = allProofs.filter(proof => 
          proof.prover === state.wallet.address
        );
        
        // If no proofs found and we have a wallet address, try controller-specific lookup
        if (userProofs.length === 0 && state.wallet.address) {
          try {
            console.log('🔍 No proofs from list API, trying controller lookup');
            const controllerProofs = await getProofsByController(state.wallet.address);
            userProofs = controllerProofs.zk_proofs || [];
            console.log('🔍 Found proofs via controller lookup:', userProofs);
          } catch (error) {
            console.warn('Controller proofs lookup failed:', error);
          }
        }
        
        console.log('🔍 Final user proofs:', userProofs);
        dispatch({
          type: 'SET_PROOFS',
          payload: userProofs,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showNotification({
        type: 'error',
        title: 'Loading Failed',
        message: 'Failed to load dashboard data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDID = async () => {
    if (!state.wallet.address) return;

    setCreatingDID(true);
    try {
      const didId = generateDIDId(state.wallet.address);
      const didDocument = {
        id: didId,
        controller: state.wallet.address,
        verificationMethod: [
          {
            id: `${didId}#key-1`,
            type: 'Ed25519VerificationKey2020',
            controller: didId,
            publicKeyBase58: `mock_key_${Math.random().toString(36).substring(2, 20)}`,
          },
        ],
        service: [
          {
            id: `${didId}#service-1`,
            type: 'PersonaIdentityService',
            serviceEndpoint: 'https://persona-chain.dev/identity',
          },
        ],
        created_at: Date.now(),
        updated_at: Date.now(),
        is_active: true,
      };

      const response = await createDID(state.wallet.address, didId, didDocument);

      if (response.code === 0) {
        dispatch({ type: 'SET_CURRENT_DID', payload: didDocument });
        setShowCreateDID(false);
        showNotification({
          type: 'success',
          title: 'DID Created',
          message: 'Your decentralized identity has been created successfully!',
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      showNotification({
        type: 'error',
        title: 'DID Creation Failed',
        message: errorMessage,
      });
    } finally {
      setCreatingDID(false);
    }
  };

  const handleCopyAddress = async (address: string) => {
    const success = await copyToClipboard(address);
    if (success) {
      showNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Address copied to clipboard',
        duration: 2000,
      });
    }
  };

  const handleCopyDID = async (didId: string) => {
    const success = await copyToClipboard(didId);
    if (success) {
      showNotification({
        type: 'success',
        title: 'Copied!',
        message: 'DID copied to clipboard',
        duration: 2000,
      });
    }
  };

  // Redirect to home if not connected
  if (!state.wallet.isConnected) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No wallet connected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please connect your Keplr wallet to view your dashboard.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">
            Go to Home
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
            Identity Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your decentralized identity, credentials, and proofs
          </p>
        </div>
        {state.currentDID && (
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <Link to="/issue" className="btn-primary flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Issue Credential</span>
            </Link>
            <Link to="/generate" className="btn-secondary flex items-center space-x-2">
              <FingerPrintIcon className="h-4 w-4" />
              <span>Generate Proof</span>
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Identity Card */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ShieldCheckIcon className="h-5 w-5" />
                  <span>My Identity</span>
                </h3>
                {!state.currentDID && (
                  <button
                    onClick={() => setShowCreateDID(true)}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    Create DID
                  </button>
                )}
              </div>

              {state.currentDID ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Wallet Address
                        </label>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm text-gray-900 font-mono">
                            {formatAddress(state.wallet.address || '', 8)}
                          </code>
                          <button
                            onClick={() => handleCopyAddress(state.wallet.address || '')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <CopyIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Balance
                        </label>
                        <div className="text-sm text-gray-900">
                          {state.wallet.balance || '0.000000 PRSN'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-primary-800">
                        DID Identifier
                      </label>
                      <span className="badge-success">Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm text-primary-900 font-mono break-all">
                        {state.currentDID.id}
                      </code>
                      <button
                        onClick={() => handleCopyDID(state.currentDID?.id || '')}
                        className="text-primary-600 hover:text-primary-800 flex-shrink-0"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(state.currentDID.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to="/issue" 
                        className="btn-primary text-sm py-2 px-3 flex items-center space-x-1"
                      >
                        <PlusIcon className="h-3 w-3" />
                        <span>Issue Credential</span>
                      </Link>
                      <Link 
                        to="/generate" 
                        className="btn-secondary text-sm py-2 px-3 flex items-center space-x-1"
                      >
                        <FingerPrintIcon className="h-3 w-3" />
                        <span>Generate Proof</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No DID found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your decentralized identity to get started.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateDID(true)}
                      className="btn-primary"
                    >
                      Create DID
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-700">Credentials</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {state.credentials.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FingerPrintIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-700">ZK Proofs</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {state.proofs.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/issue"
                  className="block w-full btn-secondary text-sm py-2 px-4 text-center"
                  style={{ textDecoration: 'none' }}
                >
                  Issue Credential
                </Link>
                <Link
                  to="/generate"
                  className="block w-full btn-secondary text-sm py-2 px-4 text-center"
                  style={{ textDecoration: 'none' }}
                >
                  Generate Proof
                </Link>
                <Link
                  to="/verify"
                  className="block w-full btn-secondary text-sm py-2 px-4 text-center"
                  style={{ textDecoration: 'none' }}
                >
                  Verify Proof
                </Link>
                <Link
                  to="/show-proof"
                  className="block w-full btn-primary text-sm py-2 px-4 text-center"
                  style={{ textDecoration: 'none' }}
                >
                  Share Proof QR
                </Link>
                <Link
                  to="/scan-verify"
                  className="block w-full btn-primary text-sm py-2 px-4 text-center"
                  style={{ textDecoration: 'none' }}
                >
                  Scan & Verify
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Credentials */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Recent Credentials</span>
            </h3>
            <Link to="/credentials" className="text-primary-600 hover:text-primary-800 text-sm">
              View all
            </Link>
          </div>

          {state.credentials.length > 0 ? (
            <div className="space-y-3">
              {state.credentials.slice(0, 3).map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {Array.isArray(credential.type) 
                        ? credential.type.filter(t => t !== 'VerifiableCredential').join(', ') || 'Verifiable Credential'
                        : credential.type || 'Unknown Type'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Issued: {credential.issued_at 
                        ? new Date(credential.issued_at * 1000).toLocaleDateString()
                        : credential.issuanceDate 
                          ? new Date(credential.issuanceDate).toLocaleDateString()
                          : 'Unknown date'
                      }
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {credential.is_revoked ? (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No credentials yet</p>
            </div>
          )}
        </div>

        {/* Recent Proofs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FingerPrintIcon className="h-5 w-5" />
              <span>Recent Proofs</span>
            </h3>
            <Link to="/proof" className="text-primary-600 hover:text-primary-800 text-sm">
              View all
            </Link>
          </div>

          {state.proofs.length > 0 ? (
            <div className="space-y-3">
              {state.proofs.slice(0, 3).map((proof) => (
                <div
                  key={proof.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {proof.circuit_id}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(proof.created_at * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {proof.is_verified ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ClockIcon className="h-5 w-5 text-yellow-500" />
                    )}
                    <button
                      onClick={() => openExplorer(proof.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <FingerPrintIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No proofs yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Create DID Modal */}
      <Modal
        isOpen={showCreateDID}
        onClose={() => setShowCreateDID(false)}
        title={state.currentDID ? "DID Already Exists" : "Create Decentralized Identity"}
      >
        <div className="space-y-4">
          {state.currentDID ? (
            <>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">You already have a DID!</h4>
                <p className="text-sm text-green-800">
                  Your decentralized identity is active and ready to use.
                </p>
                <div className="mt-3 p-2 bg-green-100 rounded text-xs font-mono text-green-900 break-all">
                  {state.currentDID.id}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateDID(false)}
                  className="btn-primary flex-1"
                >
                  Continue to Dashboard
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Create your decentralized identity (DID) on the Persona Chain. This will be your
                unique identifier on the blockchain.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What is a DID?</h4>
                <p className="text-sm text-blue-800">
                  A Decentralized Identifier (DID) is a unique, persistent identifier that you control.
                  It enables verifiable, self-sovereign digital identity without relying on centralized authorities.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateDID(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDID}
                  disabled={creatingDID}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {creatingDID ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <PlusIcon className="h-4 w-4" />
                  )}
                  <span>{creatingDID ? 'Creating...' : 'Create DID'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;