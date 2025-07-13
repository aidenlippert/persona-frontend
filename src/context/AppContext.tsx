import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  AppState,
  WalletState,
  DIDDocument,
  VerifiableCredential,
  ZKProof,
  Notification,
} from '../types';
import {
  getKeplrAccount,
  wasKeplrConnected,
  saveKeplrConnection,
  disconnectKeplr,
} from '../lib/keplr';
import { 
  getBalance, 
  getDIDByController,
  getCredentialsByController,
  getProofsByController 
} from '../lib/api';

// Local Storage Keys
const STORAGE_KEYS = {
  CURRENT_DID: 'persona_current_did',
  CREDENTIALS: 'persona_credentials',
  PROOFS: 'persona_proofs',
} as const;

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove ${key} from localStorage:`, error);
  }
};

// Initial State
const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  balance: null,
  chainId: null,
};

const initialAppState: AppState = {
  wallet: initialWalletState,
  currentDID: (() => {
    const did = loadFromStorage(STORAGE_KEYS.CURRENT_DID, null);
    console.log('🔍 Loading DID from localStorage on app init:', did);
    return did;
  })(),
  credentials: loadFromStorage(STORAGE_KEYS.CREDENTIALS, []),
  proofs: loadFromStorage(STORAGE_KEYS.PROOFS, []),
  loading: false,
  error: null,
};

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CONNECT_WALLET'; payload: { address: string; chainId: string } }
  | { type: 'DISCONNECT_WALLET' }
  | { type: 'SET_BALANCE'; payload: string }
  | { type: 'SET_CURRENT_DID'; payload: DIDDocument | null }
  | { type: 'SET_CREDENTIALS'; payload: VerifiableCredential[] }
  | { type: 'ADD_CREDENTIAL'; payload: VerifiableCredential }
  | { type: 'UPDATE_CREDENTIAL'; payload: VerifiableCredential }
  | { type: 'SET_PROOFS'; payload: ZKProof[] }
  | { type: 'ADD_PROOF'; payload: ZKProof }
  | { type: 'UPDATE_PROOF'; payload: ZKProof };

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CONNECT_WALLET':
      return {
        ...state,
        wallet: {
          isConnected: true,
          address: action.payload.address,
          balance: null,
          chainId: action.payload.chainId,
        },
        error: null,
      };

    case 'DISCONNECT_WALLET':
      // Clear localStorage when disconnecting
      removeFromStorage(STORAGE_KEYS.CURRENT_DID);
      removeFromStorage(STORAGE_KEYS.CREDENTIALS);
      removeFromStorage(STORAGE_KEYS.PROOFS);
      return {
        ...state,
        wallet: initialWalletState,
        currentDID: null,
        credentials: [],
        proofs: [],
      };

    case 'SET_BALANCE':
      return {
        ...state,
        wallet: {
          ...state.wallet,
          balance: action.payload,
        },
      };

    case 'SET_CURRENT_DID':
      saveToStorage(STORAGE_KEYS.CURRENT_DID, action.payload);
      return { ...state, currentDID: action.payload };

    case 'SET_CREDENTIALS':
      saveToStorage(STORAGE_KEYS.CREDENTIALS, action.payload);
      return { ...state, credentials: action.payload };

    case 'ADD_CREDENTIAL':
      const newCredentials = [...state.credentials, action.payload];
      saveToStorage(STORAGE_KEYS.CREDENTIALS, newCredentials);
      return {
        ...state,
        credentials: newCredentials,
      };

    case 'UPDATE_CREDENTIAL':
      const updatedCredentials = state.credentials.map((cred) =>
        cred.id === action.payload.id ? action.payload : cred
      );
      saveToStorage(STORAGE_KEYS.CREDENTIALS, updatedCredentials);
      return {
        ...state,
        credentials: updatedCredentials,
      };

    case 'SET_PROOFS':
      saveToStorage(STORAGE_KEYS.PROOFS, action.payload);
      return { ...state, proofs: action.payload };

    case 'ADD_PROOF':
      const newProofs = [...state.proofs, action.payload];
      saveToStorage(STORAGE_KEYS.PROOFS, newProofs);
      return {
        ...state,
        proofs: newProofs,
      };

    case 'UPDATE_PROOF':
      const updatedProofs = state.proofs.map((proof) =>
        proof.id === action.payload.id ? action.payload : proof
      );
      saveToStorage(STORAGE_KEYS.PROOFS, updatedProofs);
      return {
        ...state,
        proofs: updatedProofs,
      };

    default:
      return state;
  }
};

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Notification Context
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification State
const useNotificationsInternal = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove after duration
      const duration = notification.duration || 5000;
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, duration);
    },
    []
  );

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, addNotification, removeNotification };
};

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const { notifications, addNotification, removeNotification } = useNotificationsInternal();

  // Load blockchain data for the connected wallet
  const loadBlockchainData = async (walletAddress: string) => {
    try {
      console.log('🔄 Loading blockchain data for wallet:', walletAddress);
      
      // First, try to find DID linked to this specific wallet address
      const didDoc = await getDIDByController(walletAddress);
      console.log('📍 DID lookup result for controller:', walletAddress, didDoc);
      
      if (didDoc && didDoc.id) {
        console.log('✅ Found existing DID for wallet:', didDoc);
        dispatch({ type: 'SET_CURRENT_DID', payload: didDoc });
        saveToStorage(STORAGE_KEYS.CURRENT_DID, didDoc);
      } else {
        console.log('❌ No DID found for wallet, will need to create one');
        dispatch({ type: 'SET_CURRENT_DID', payload: null });
        localStorage.removeItem(STORAGE_KEYS.CURRENT_DID);
      }
      
      // Load credentials and proofs for this specific controller
      const [credentialsResponse, proofsResponse] = await Promise.allSettled([
        getCredentialsByController(walletAddress),
        getProofsByController(walletAddress),
      ]);

      let userCredentials: any[] = [];
      let userProofs: any[] = [];

      // Handle Credentials
      if (credentialsResponse.status === 'fulfilled') {
        console.log('🔍 Credentials response for controller:', credentialsResponse.value);
        userCredentials = credentialsResponse.value.vc_records || [];
        console.log('✅ Found', userCredentials.length, 'credentials for wallet');
        dispatch({ type: 'SET_CREDENTIALS', payload: userCredentials });
      } else {
        console.warn('Failed to load credentials:', credentialsResponse.reason);
      }

      // Handle Proofs
      if (proofsResponse.status === 'fulfilled') {
        console.log('🔍 Proofs response for controller:', proofsResponse.value);
        userProofs = proofsResponse.value.zk_proofs || [];
        console.log('✅ Found', userProofs.length, 'proofs for wallet');
        dispatch({ type: 'SET_PROOFS', payload: userProofs });
      } else {
        console.warn('Failed to load proofs:', proofsResponse.reason);
      }

      console.log('✅ Blockchain data loaded successfully');
      console.log('📊 Summary: Credentials:', userCredentials.length, 'Proofs:', userProofs.length);
      
    } catch (error) {
      console.error('❌ Failed to load blockchain data:', error);
    }
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (wasKeplrConnected()) {
        try {
          const account = await getKeplrAccount();
          if (account) {
            dispatch({
              type: 'CONNECT_WALLET',
              payload: {
                address: account.address,
                chainId: 'persona-testnet-1',
              },
            });
            saveKeplrConnection(account.address);
            
            // Refresh balance and load blockchain data
            await refreshBalance(account.address);
            await loadBlockchainData(account.address);
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          disconnectKeplr();
        }
      }
    };

    autoConnect();
  }, []);

  const connectWallet = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { connectKeplr } = await import('../lib/keplr');
      const account = await connectKeplr();

      dispatch({
        type: 'CONNECT_WALLET',
        payload: {
          address: account.address,
          chainId: 'persona-testnet-1',
        },
      });

      saveKeplrConnection(account.address);
      await refreshBalance(account.address);
      await loadBlockchainData(account.address);

      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: `Successfully connected to ${account.name}`,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const disconnectWallet = () => {
    disconnectKeplr();
    dispatch({ type: 'DISCONNECT_WALLET' });
    
    addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Successfully disconnected from wallet',
    });
  };

  const refreshBalance = async (address?: string) => {
    const walletAddress = address || state.wallet.address;
    if (!walletAddress) return;

    try {
      const balanceData = await getBalance(walletAddress);
      const prsnBalance = balanceData.balances?.find(
        (balance) => balance.denom === 'uprsn'
      );
      
      const formattedBalance = prsnBalance
        ? (parseInt(prsnBalance.amount) / 1000000).toFixed(6)
        : '0.000000';
      
      dispatch({ type: 'SET_BALANCE', payload: `${formattedBalance} PRSN` });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      // Don't show error notification for balance refresh failures
    }
  };

  const showNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    addNotification(notification);
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    showNotification,
  };

  const notificationContextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        {children}
      </NotificationContext.Provider>
    </AppContext.Provider>
  );
};

// Hooks
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within an AppProvider');
  }
  return context;
};