import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  WalletIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import { formatAddress } from '../../lib/keplr';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { state, connectWallet, disconnectWallet } = useApp();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: ShieldCheckIcon },
    { name: 'Issue Credential', href: '/issue', icon: DocumentTextIcon },
    { name: 'Generate Proof', href: '/proof', icon: FingerPrintIcon },
    { name: 'Verify', href: '/verify', icon: MagnifyingGlassIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <ShieldCheckIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Persona Chain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {state.wallet.isConnected ? (
              <div className="flex items-center space-x-3">
                {/* Balance Display */}
                {state.wallet.balance && (
                  <div className="hidden sm:block text-sm text-gray-600">
                    {state.wallet.balance}
                  </div>
                )}
                
                {/* Address Display */}
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                  <WalletIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatAddress(state.wallet.address || '')}
                  </span>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnectWallet}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={state.loading}
                className="btn-primary flex items-center space-x-2"
              >
                {state.loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <WalletIcon className="h-4 w-4" />
                )}
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3 bg-white border-t border-gray-200">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile Wallet Info */}
          {state.wallet.isConnected && (
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatAddress(state.wallet.address || '')}
                  </p>
                  {state.wallet.balance && (
                    <p className="text-sm text-gray-600">{state.wallet.balance}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    disconnectWallet();
                    setMobileMenuOpen(false);
                  }}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;