import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  EyeIcon,
  ArrowRightIcon,
  SparklesIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';

const Home: React.FC = () => {
  const { state, connectWallet } = useApp();

  const features = [
    {
      name: 'Decentralized Identity',
      description: 'Create and manage your digital identity on the blockchain with full control and ownership.',
      icon: ShieldCheckIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Verifiable Credentials',
      description: 'Issue and receive tamper-proof credentials that can be verified by anyone, anywhere.',
      icon: DocumentTextIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Zero-Knowledge Proofs',
      description: 'Prove facts about yourself without revealing sensitive personal information.',
      icon: FingerPrintIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Privacy First',
      description: 'Your personal data stays private while still being verifiable and trustworthy.',
      icon: LockClosedIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const steps = [
    {
      title: 'Connect Your Wallet',
      description: 'Connect your Keplr wallet to get started with Persona Chain.',
      action: 'Connect Wallet',
      href: '#connect',
      icon: ShieldCheckIcon,
    },
    {
      title: 'Create Your Identity',
      description: 'Set up your decentralized identity (DID) on the blockchain.',
      action: 'Go to Dashboard',
      href: '/dashboard',
      icon: DocumentTextIcon,
    },
    {
      title: 'Issue Credentials',
      description: 'Create verifiable credentials like proof of age or identity.',
      action: 'Issue Credential',
      href: '/issue',
      icon: DocumentTextIcon,
    },
    {
      title: 'Generate Proofs',
      description: 'Create zero-knowledge proofs to verify information privately.',
      action: 'Generate Proof',
      href: '/proof',
      icon: FingerPrintIcon,
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-purple-600">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your Identity,{' '}
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Your Control
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Persona Chain is a privacy-preserving identity platform built on blockchain technology.
            Create verifiable credentials and generate zero-knowledge proofs while keeping your data private.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {!state.wallet.isConnected ? (
              <button
                onClick={connectWallet}
                disabled={state.loading}
                className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
              >
                {state.loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <ShieldCheckIcon className="h-5 w-5" />
                )}
                <span>Get Started</span>
              </button>
            ) : (
              <Link to="/dashboard" className="btn-primary flex items-center space-x-2 text-lg px-8 py-4">
                <ArrowRightIcon className="h-5 w-5" />
                <span>Go to Dashboard</span>
              </Link>
            )}
            <Link
              to="/verify"
              className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4"
            >
              <EyeIcon className="h-5 w-5" />
              <span>Verify Proof</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Powerful Features
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need for secure, private, and verifiable digital identity.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.name} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className={`rounded-lg p-3 ${feature.bgColor}`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                    <p className="mt-2 text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get started with Persona Chain in just a few simple steps.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const isWalletStep = step.href === '#connect';
            const isCompleted = state.wallet.isConnected && isWalletStep;
            
            return (
              <div key={step.title} className="text-center">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4">
                    <span className="text-sm font-semibold">{index + 1}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{step.description}</p>
                {isWalletStep ? (
                  <button
                    onClick={connectWallet}
                    disabled={state.loading || isCompleted}
                    className={`btn-primary text-sm py-2 px-4 w-full ${
                      isCompleted ? 'bg-green-600 hover:bg-green-700' : ''
                    }`}
                  >
                    {isCompleted ? '✓ Connected' : state.loading ? 'Connecting...' : step.action}
                  </button>
                ) : (
                  <Link
                    to={step.href}
                    className={`btn-secondary text-sm py-2 px-4 w-full inline-block ${
                      !state.wallet.isConnected ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {step.action}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">100%</div>
              <div className="text-sm text-gray-600 mt-1">Privacy Preserved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">Instant</div>
              <div className="text-sm text-gray-600 mt-1">Verification</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">Secure</div>
              <div className="text-sm text-gray-600 mt-1">By Design</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="gradient-bg rounded-2xl p-8 text-center text-white">
        <SparklesIcon className="mx-auto h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg opacity-90 mb-6">
          Join the future of digital identity with Persona Chain.
        </p>
        {!state.wallet.isConnected ? (
          <button
            onClick={connectWallet}
            disabled={state.loading}
            className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {state.loading ? 'Connecting...' : 'Connect Wallet Now'}
          </button>
        ) : (
          <Link
            to="/dashboard"
            className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-colors inline-block"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
};

export default Home;