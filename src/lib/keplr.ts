import type { ChainInfo, Window as KeplrWindow } from '../types';

declare let window: KeplrWindow;

// Persona Chain configuration for Keplr
export const PERSONA_CHAIN_CONFIG: ChainInfo = {
  chainId: 'persona-testnet-1',
  chainName: 'Persona Chain Testnet',
  rpc: 'http://localhost:26657',
  rest: 'http://localhost:1317',
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'persona',
    bech32PrefixAccPub: 'personapub',
    bech32PrefixValAddr: 'personavaloper',
    bech32PrefixValPub: 'personavaloperpub',
    bech32PrefixConsAddr: 'personavalcons',
    bech32PrefixConsPub: 'personavalconspub',
  },
  currencies: [
    {
      coinDenom: 'PRSN',
      coinMinimalDenom: 'uprsn',
      coinDecimals: 6,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'PRSN',
      coinMinimalDenom: 'uprsn',
      coinDecimals: 6,
    },
  ],
  stakeCurrency: {
    coinDenom: 'PRSN',
    coinMinimalDenom: 'uprsn',
    coinDecimals: 6,
  },
  features: ['ibc-transfer', 'ibc-go'],
};

/**
 * Check if Keplr wallet is installed
 */
export const isKeplrInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.keplr;
};

/**
 * Connect to Keplr wallet and add Persona Chain
 */
export const connectKeplr = async (): Promise<{
  address: string;
  name: string;
  pubKey: string;
}> => {
  if (!isKeplrInstalled()) {
    throw new Error(
      'Keplr wallet is not installed. Please install it from https://www.keplr.app/'
    );
  }

  try {
    // Suggest the chain to Keplr
    await window.keplr!.experimentalSuggestChain(PERSONA_CHAIN_CONFIG);

    // Enable the chain
    await window.keplr!.enable(PERSONA_CHAIN_CONFIG.chainId);

    // Get the key and address
    const key = await window.keplr!.getKey(PERSONA_CHAIN_CONFIG.chainId);

    return {
      address: key.bech32Address,
      name: key.name,
      pubKey: btoa(String.fromCharCode(...key.pubKey)),
    };
  } catch (error: any) {
    console.error('Failed to connect to Keplr:', error);
    
    if (error.message?.includes('Request rejected')) {
      throw new Error('Connection rejected by user');
    }
    
    if (error.message?.includes('Unknown chain')) {
      throw new Error('Failed to add Persona Chain to Keplr');
    }
    
    throw new Error(`Failed to connect to Keplr: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get current Keplr account info
 */
export const getKeplrAccount = async (): Promise<{
  address: string;
  name: string;
  pubKey: string;
} | null> => {
  if (!isKeplrInstalled()) {
    return null;
  }

  try {
    const key = await window.keplr!.getKey(PERSONA_CHAIN_CONFIG.chainId);
    return {
      address: key.bech32Address,
      name: key.name,
      pubKey: btoa(String.fromCharCode(...key.pubKey)),
    };
  } catch (error) {
    console.error('Failed to get Keplr account:', error);
    return null;
  }
};

/**
 * Sign a transaction with Keplr
 */
export const signTransaction = async (
  address: string,
  txData: any
): Promise<any> => {
  if (!isKeplrInstalled()) {
    throw new Error('Keplr wallet is not installed');
  }

  try {
    const offlineSigner = window.getOfflineSigner!(PERSONA_CHAIN_CONFIG.chainId);
    const accounts = await offlineSigner.getAccounts();
    
    const account = accounts.find(acc => acc.address === address);
    if (!account) {
      throw new Error('Account not found in Keplr');
    }

    // Note: This is a simplified signing flow
    // In a real implementation, you would use CosmJS for proper transaction signing
    console.log('Signing transaction with Keplr...', txData);
    
    // For now, return the transaction data as-is
    // In production, implement proper signing with CosmJS
    return txData;
  } catch (error: any) {
    console.error('Failed to sign transaction:', error);
    throw new Error(`Failed to sign transaction: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Disconnect from Keplr (clear local state)
 */
export const disconnectKeplr = (): void => {
  // Keplr doesn't have a disconnect method
  // We just clear our local state
  localStorage.removeItem('keplr_connected');
  localStorage.removeItem('persona_wallet_address');
};

/**
 * Check if user was previously connected
 */
export const wasKeplrConnected = (): boolean => {
  return localStorage.getItem('keplr_connected') === 'true';
};

/**
 * Save connection state
 */
export const saveKeplrConnection = (address: string): void => {
  localStorage.setItem('keplr_connected', 'true');
  localStorage.setItem('persona_wallet_address', address);
};

/**
 * Get saved wallet address
 */
export const getSavedWalletAddress = (): string | null => {
  return localStorage.getItem('persona_wallet_address');
};

/**
 * Format address for display (truncate middle)
 */
export const formatAddress = (address: string, length: number = 6): string => {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

/**
 * Format balance for display
 */
export const formatBalance = (
  amount: string | number,
  decimals: number = 6,
  symbol: string = 'PRSN'
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = (numAmount / Math.pow(10, decimals)).toFixed(6);
  
  // Remove trailing zeros
  const cleaned = formatted.replace(/\.?0+$/, '');
  
  return `${cleaned} ${symbol}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Open block explorer for transaction
 */
export const openExplorer = (txHash: string): void => {
  const explorerUrl = `http://localhost:3000/tx/${txHash}`;
  (window as any).open(explorerUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Validate Persona Chain address
 */
export const isValidPersonaAddress = (address: string): boolean => {
  if (!address) return false;
  
  // Persona addresses should start with 'persona' and be 39-46 characters long
  const addressRegex = /^persona1[a-z0-9]{32,39}$/;
  return addressRegex.test(address);
};

/**
 * Generate a unique DID identifier
 */
export const generateDIDId = (address: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `did:persona:${address.slice(-8)}${timestamp}${random}`;
};

/**
 * Generate a unique credential ID
 */
export const generateCredentialId = (prefix: string = 'urn:credential'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}:${timestamp}-${random}`;
};

/**
 * Generate a unique proof ID
 */
export const generateProofId = (prefix: string = 'proof'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
};