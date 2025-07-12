# 🌐 Persona Chain Frontend

> **Production-ready decentralized identity frontend for [Persona Chain](https://personapass.xyz)**

A modern, responsive web application for managing decentralized identities, verifiable credentials, and zero-knowledge proofs on the Persona Chain blockchain.

[![Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://personapass.xyz)
[![Built with](https://img.shields.io/badge/Built%20with-React%20TypeScript-blue?logo=react)](https://reactjs.org/)
[![Styled with](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Blockchain](https://img.shields.io/badge/Blockchain-Cosmos-7C4DFF?logo=cosmos)](https://cosmos.network/)

## ✨ Features

### 🏠 **Home & Wallet Connection**
- **Keplr Wallet Integration** - Seamless connection to Cosmos ecosystem
- **Chain Configuration** - Auto-configures Persona Chain testnet
- **Connection Persistence** - Remembers wallet state across sessions

### 🆔 **Identity Dashboard**  
- **DID Management** - Create and manage decentralized identifiers
- **Account Overview** - View wallet balance and blockchain status
- **Quick Actions** - Fast access to all identity operations

### 📜 **Credential Issuance**
- **Verifiable Credentials** - Issue W3C-standard credentials
- **Age Verification** - Built-in proof-of-age credential types
- **Blockchain Storage** - Tamper-proof credential storage

### 🔐 **Zero-Knowledge Proofs**
- **Privacy-Preserving Proofs** - Prove facts without revealing data
- **Age Verification Circuits** - Prove age requirements (18+, 21+)
- **Real-time Generation** - Interactive proof creation with progress tracking

### 🔍 **Proof Verification**
- **Universal Verification** - Verify any zero-knowledge proof
- **Multiple Methods** - Verify by proof ID or transaction hash
- **Detailed Results** - Complete proof metadata and transaction info

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for fast development and optimized builds
- **Blockchain**: Cosmos SDK integration via Keplr wallet
- **State Management**: React Context with useReducer
- **HTTP Client**: Axios with interceptors and error handling
- **Icons**: Heroicons for consistent UI elements
- **Routing**: React Router for client-side navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Keplr wallet extension installed
- Persona Chain testnet running locally (ports 1317-1320)

### Installation

```bash
# Clone the repository
git clone https://github.com/aidenlippert/persona-frontend.git
cd persona-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Live Demo

**🔗 [https://personapass.xyz](https://personapass.xyz)**

Try the live application with:
1. Install [Keplr Wallet](https://www.keplr.app/)
2. Connect to Persona Chain testnet
3. Create your decentralized identity
4. Issue credentials and generate proofs!

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Navigation and page layout
│   └── UI/             # Common UI elements (modals, spinners, etc.)
├── context/            # React Context for state management
├── lib/                # Core libraries and utilities
│   ├── api.ts          # Blockchain API client
│   └── keplr.ts        # Keplr wallet integration
├── pages/              # Main application pages
│   ├── Home.tsx        # Landing page and wallet connection
│   ├── Dashboard.tsx   # Identity overview and management
│   ├── IssueCredential.tsx    # Credential issuance form
│   ├── GenerateProof.tsx      # ZK proof generation
│   └── VerifyProof.tsx        # Proof verification
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
```

## 🔧 Configuration

### Environment Setup

The application connects to a local Persona Chain testnet by default:

```typescript
// Default configuration in src/lib/api.ts
const API_BASE_URL = 'http://localhost:1317';  // Cosmos REST API
const RPC_URL = 'http://localhost:26657';      // Tendermint RPC
```

### Keplr Chain Configuration

```typescript
// Chain configuration in src/lib/keplr.ts
export const PERSONA_CHAIN_CONFIG = {
  chainId: 'persona-testnet-1',
  chainName: 'Persona Chain Testnet',
  rpc: 'http://localhost:26657',
  rest: 'http://localhost:1317',
  // ... additional chain parameters
};
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Code Style

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for consistent formatting
- **Tailwind CSS** for utility-first styling

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set framework preset to "Vite"
4. Set output directory to "dist"
5. Deploy!

### IPFS

```bash
# Build and deploy to IPFS
npm run build
ipfs add -r dist/
```

### Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure redirects for SPA routing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cosmos SDK** for blockchain infrastructure
- **Keplr** for wallet integration
- **Tailwind CSS** for styling system
- **React** and **TypeScript** for frontend framework
- **Vite** for build tooling

---

**🤖 Built with [Claude Code](https://claude.ai/code)**

*Powering the future of decentralized identity on [Persona Chain](https://personapass.xyz)*