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
import { getBalance } from '../lib/api';

// Initial State
const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  balance: null,
  chainId: null,
};

const initialAppState: AppState = {
  wallet: initialWalletState,
  currentDID: null,
  credentials: [],
  proofs: [],
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
      return { ...state, currentDID: action.payload };

    case 'SET_CREDENTIALS':
      return { ...state, credentials: action.payload };

    case 'ADD_CREDENTIAL':
      return {
        ...state,
        credentials: [...state.credentials, action.payload],
      };

    case 'UPDATE_CREDENTIAL':
      return {
        ...state,
        credentials: state.credentials.map((cred) =>
          cred.id === action.payload.id ? action.payload : cred
        ),
      };

    case 'SET_PROOFS':
      return { ...state, proofs: action.payload };

    case 'ADD_PROOF':
      return {
        ...state,
        proofs: [...state.proofs, action.payload],
      };

    case 'UPDATE_PROOF':
      return {
        ...state,
        proofs: state.proofs.map((proof) =>
          proof.id === action.payload.id ? action.payload : proof
        ),
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
            
            // Refresh balance
            await refreshBalance(account.address);
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