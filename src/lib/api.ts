import axios from 'axios';
import type {
  DIDDocument,
  VerifiableCredential,
  ZKProof,
  Circuit,
  TransactionResponse,
} from '../types';

// API Configuration
const API_BASE_URL = 'http://localhost:1317';
const FAUCET_BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Health Check
export const getHealth = async (): Promise<any> => {
  const response = await api.get('/health');
  return response.data;
};

export const getNodeStatus = async (): Promise<any> => {
  const response = await api.get('/status');
  return response.data;
};

// DID Operations
export const listDIDs = async (): Promise<{ did_documents: DIDDocument[] }> => {
  const response = await api.get('/persona/did/v1beta1/did_documents');
  return response.data;
};

export const getDID = async (didId: string): Promise<{ did_document: DIDDocument }> => {
  const response = await api.get(`/persona/did/v1beta1/did_documents/${encodeURIComponent(didId)}`);
  return response.data;
};

export const getDIDByController = async (controller: string): Promise<DIDDocument | null> => {
  try {
    const response = await api.get(`/persona/did/v1beta1/did_by_controller/${encodeURIComponent(controller)}`);
    return response.data.did_document;
  } catch (error) {
    console.warn('Failed to get DID by controller:', error);
    return null;
  }
};

export const createDID = async (
  creator: string,
  didId: string,
  didDocument: Partial<DIDDocument>
): Promise<TransactionResponse> => {
  const txData = {
    tx: {
      body: {
        messages: [
          {
            '@type': '/persona.did.v1.MsgCreateDid',
            creator,
            did_id: didId,
            did_document: JSON.stringify(didDocument),
          },
        ],
        memo: '',
        timeout_height: '0',
        extension_options: [],
        non_critical_extension_options: [],
      },
      auth_info: {
        signer_infos: [],
        fee: {
          amount: [{ denom: 'uprsn', amount: '5000' }],
          gas_limit: '200000',
          payer: '',
          granter: '',
        },
      },
      signatures: [],
    },
    mode: 'BROADCAST_MODE_SYNC',
  };

  const response = await api.post('/cosmos/tx/v1beta1/txs', txData);
  return response.data;
};

// Verifiable Credentials Operations
export const listCredentials = async (): Promise<{ vc_records: VerifiableCredential[] }> => {
  const response = await api.get('/persona/vc/v1beta1/credentials');
  return response.data;
};

export const getCredentialsByController = async (controller: string): Promise<{ vc_records: VerifiableCredential[] }> => {
  const response = await api.get(`/persona/vc/v1beta1/credentials_by_controller/${encodeURIComponent(controller)}`);
  return response.data;
};

export const getCredential = async (credentialId: string): Promise<{ vc_record: VerifiableCredential }> => {
  const response = await api.get(`/persona/vc/v1beta1/credentials/${credentialId}`);
  return response.data;
};

export const issueCredential = async (
  issuer: string,
  credentialId: string,
  credentialType: string,
  subject: string,
  claims: Record<string, any>
): Promise<TransactionResponse> => {
  const txData = {
    tx: {
      body: {
        messages: [
          {
            '@type': '/persona.vc.v1.MsgIssueCredential',
            issuer,
            credential_id: credentialId,
            credential_type: credentialType,
            subject,
            claims: JSON.stringify(claims),
          },
        ],
        memo: '',
        timeout_height: '0',
        extension_options: [],
        non_critical_extension_options: [],
      },
      auth_info: {
        signer_infos: [],
        fee: {
          amount: [{ denom: 'uprsn', amount: '5000' }],
          gas_limit: '200000',
          payer: '',
          granter: '',
        },
      },
      signatures: [],
    },
    mode: 'BROADCAST_MODE_SYNC',
  };

  const response = await api.post('/cosmos/tx/v1beta1/txs', txData);
  return response.data;
};

export const revokeCredential = async (
  revoker: string,
  credentialId: string,
  reason: string
): Promise<TransactionResponse> => {
  const txData = {
    tx: {
      body: {
        messages: [
          {
            '@type': '/persona.vc.v1.MsgRevokeCredential',
            revoker,
            credential_id: credentialId,
            reason,
          },
        ],
        memo: '',
        timeout_height: '0',
        extension_options: [],
        non_critical_extension_options: [],
      },
      auth_info: {
        signer_infos: [],
        fee: {
          amount: [{ denom: 'uprsn', amount: '5000' }],
          gas_limit: '200000',
          payer: '',
          granter: '',
        },
      },
      signatures: [],
    },
    mode: 'BROADCAST_MODE_SYNC',
  };

  const response = await api.post('/cosmos/tx/v1beta1/txs', txData);
  return response.data;
};

// ZK Proof Operations
export const listProofs = async (): Promise<{ zk_proofs: ZKProof[] }> => {
  const response = await api.get('/persona/zk/v1beta1/proofs');
  return response.data;
};

export const getProofsByController = async (controller: string): Promise<{ zk_proofs: ZKProof[] }> => {
  const response = await api.get(`/persona/zk/v1beta1/proofs_by_controller/${encodeURIComponent(controller)}`);
  return response.data;
};

export const getProof = async (proofId: string): Promise<{ zk_proof: ZKProof }> => {
  const response = await api.get(`/persona/zk/v1beta1/proofs/${proofId}`);
  return response.data;
};

export const submitProof = async (
  creator: string,
  circuitId: string,
  proofData: string,
  publicInputs: string[],
  metadata: Record<string, any>
): Promise<TransactionResponse> => {
  const txData = {
    tx: {
      body: {
        messages: [
          {
            '@type': '/persona.zk.v1.MsgSubmitProof',
            creator,
            circuit_id: circuitId,
            proof: proofData,
            public_inputs: publicInputs,
            metadata: JSON.stringify(metadata),
          },
        ],
        memo: '',
        timeout_height: '0',
        extension_options: [],
        non_critical_extension_options: [],
      },
      auth_info: {
        signer_infos: [],
        fee: {
          amount: [{ denom: 'uprsn', amount: '5000' }],
          gas_limit: '200000',
          payer: '',
          granter: '',
        },
      },
      signatures: [],
    },
    mode: 'BROADCAST_MODE_SYNC',
  };

  const response = await api.post('/cosmos/tx/v1beta1/txs', txData);
  return response.data;
};

export const verifyProof = async (proofId: string): Promise<{ is_valid: boolean; details: any }> => {
  const response = await api.get(`/persona/zk/v1beta1/proofs/${proofId}/verify`);
  return response.data;
};

// Circuit Operations
export const listCircuits = async (): Promise<{ circuits: Circuit[] }> => {
  const response = await api.get('/persona/zk/v1beta1/circuits');
  return response.data;
};

export const getCircuit = async (circuitId: string): Promise<{ circuit: Circuit }> => {
  const response = await api.get(`/persona/zk/v1beta1/circuits/${circuitId}`);
  return response.data;
};

// Account Operations
export const getBalance = async (address: string): Promise<{ balances: any[]; pagination: any }> => {
  const response = await api.get(`/cosmos/bank/v1beta1/balances/${address}`);
  return response.data;
};

// Transaction Operations
export const getTransaction = async (txHash: string): Promise<TransactionResponse> => {
  const response = await api.get(`/cosmos/tx/v1beta1/txs/${txHash}`);
  return response.data;
};

export const broadcastTransaction = async (txData: any): Promise<TransactionResponse> => {
  const response = await api.post('/cosmos/tx/v1beta1/txs', txData);
  return response.data;
};

// Faucet Operations
export const requestFaucetTokens = async (address: string): Promise<any> => {
  const response = await axios.post(`${FAUCET_BASE_URL}/faucet`, {
    address,
  });
  return response.data;
};

export const getFaucetInfo = async (): Promise<any> => {
  const response = await axios.get(`${FAUCET_BASE_URL}/info`);
  return response.data;
};

// Utility Functions
export const generateMockProofData = () => {
  return {
    pi_a: [
      Math.random().toString(36).substring(2, 15),
      Math.random().toString(36).substring(2, 15),
      '1',
    ],
    pi_b: [
      [
        Math.random().toString(36).substring(2, 15),
        Math.random().toString(36).substring(2, 15),
      ],
      [
        Math.random().toString(36).substring(2, 15),
        Math.random().toString(36).substring(2, 15),
      ],
      ['1', '0'],
    ],
    pi_c: [
      Math.random().toString(36).substring(2, 15),
      Math.random().toString(36).substring(2, 15),
      '1',
    ],
    protocol: 'groth16',
    curve: 'bn128',
  };
};

export const base64Encode = (obj: any): string => {
  return btoa(JSON.stringify(obj));
};

export const base64Decode = (str: string): any => {
  try {
    return JSON.parse(atob(str));
  } catch (error) {
    console.error('Failed to decode base64:', error);
    return null;
  }
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};