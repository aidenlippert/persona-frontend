// Keplr Wallet Types
export interface Window {
  keplr?: {
    enable: (chainId: string) => Promise<void>;
    experimentalSuggestChain: (chainInfo: ChainInfo) => Promise<void>;
    getKey: (chainId: string) => Promise<Key>;
    getOfflineSigner: (chainId: string) => OfflineSigner;
  };
  getOfflineSigner?: (chainId: string) => OfflineSigner;
}

export interface ChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bip44: { coinType: number };
  bech32Config: {
    bech32PrefixAccAddr: string;
    bech32PrefixAccPub: string;
    bech32PrefixValAddr: string;
    bech32PrefixValPub: string;
    bech32PrefixConsAddr: string;
    bech32PrefixConsPub: string;
  };
  currencies: Currency[];
  feeCurrencies: Currency[];
  stakeCurrency: Currency;
  features?: string[];
}

export interface Currency {
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
  coinGeckoId?: string;
}

export interface Key {
  name: string;
  algo: string;
  pubKey: Uint8Array;
  address: Uint8Array;
  bech32Address: string;
}

export interface OfflineSigner {
  getAccounts: () => Promise<readonly AccountData[]>;
  signDirect: (signerAddress: string, signDoc: SignDoc) => Promise<DirectSignResponse>;
}

export interface AccountData {
  address: string;
  algo: string;
  pubkey: Uint8Array;
}

export interface SignDoc {
  bodyBytes: Uint8Array;
  authInfoBytes: Uint8Array;
  chainId: string;
  accountNumber: Long;
}

export interface DirectSignResponse {
  signed: SignDoc;
  signature: StdSignature;
}

export interface StdSignature {
  pub_key: {
    type: string;
    value: string;
  };
  signature: string;
}

export interface Long {
  high: number;
  low: number;
  unsigned: boolean;
}

// Persona Chain Types
export interface DIDDocument {
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  service?: Service[];
  created_at: number;
  updated_at: number;
  is_active: boolean;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58?: string;
  publicKeyMultibase?: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: CredentialSubject;
  proof?: CredentialProof;
  expirationDate?: string;
  is_revoked: boolean;
  issued_at: number;
}

export interface CredentialSubject {
  id: string;
  [key: string]: any;
}

export interface CredentialProof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  jws: string;
}

export interface ZKProof {
  id: string;
  circuit_id: string;
  prover: string;
  proof_data: string;
  public_inputs: string[];
  metadata: string;
  is_verified: boolean;
  created_at: number;
}

export interface Circuit {
  id: string;
  name: string;
  description: string;
  creator: string;
  verification_key: string;
  is_active: boolean;
  created_at: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface TransactionResponse {
  txhash: string;
  height: number;
  code: number;
  data: string;
  raw_log?: string;
  logs?: TxLog[];
  gas_wanted: number;
  gas_used: number;
}

export interface TxLog {
  msg_index: number;
  log: string;
  events: TxEvent[];
}

export interface TxEvent {
  type: string;
  attributes: TxAttribute[];
}

export interface TxAttribute {
  key: string;
  value: string;
}

// UI State Types
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: string | null;
}

export interface AppState {
  wallet: WalletState;
  currentDID: DIDDocument | null;
  credentials: VerifiableCredential[];
  proofs: ZKProof[];
  loading: boolean;
  error: string | null;
}

// Form Types
export interface CreateDIDForm {
  didId: string;
}

export interface IssueCredentialForm {
  name: string;
  birthYear: number;
  credentialType: string;
}

export interface GenerateProofForm {
  credentialId: string;
  circuitId: string;
  minAge: number;
}

export interface VerifyProofForm {
  proofId?: string;
  txHash?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}