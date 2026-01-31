# University Payments System

A transparent, secure, and modern university payment system built on Ethereum using **Scaffold-ETH 2**.

## 🏗 High-Level Features

- **Decentralized Payments**: Students can pay for university services directly in ETH with automatic overpayment refunds.
- **Admin Management**: University staff can manage services (create, update, deactivate) and withdraw funds through a secure interface.
- **Transparency**: Every transaction is recorded on-chain with verifiable events.
- **Modern UI**: A responsive dashboard with real-time updates and balance tracking.

## 🛠 Tech Stack

- **Solidity**: Smart contract logic (`UniversityPayments.sol`).
- **Hardhat**: Development environment and testing framework.
- **Next.js**: React frontend with App Router.
- **Scaffold-ETH 2 Hooks**: `useScaffoldReadContract`, `useScaffoldWriteContract`, `useScaffoldEventHistory`.
- **UI Components**: RainbowKit, Wagmi, Viem, and custom `@scaffold-ui/components`.
- **Styling**: Tailwind CSS with DaisyUI.

## 🚀 Getting Started

### 1. Requirements
- Node.js >= 20.x
- Yarn

### 2. Installation
```bash
yarn install
```

### 3. Local Development
Run each in a separate terminal:
```bash
yarn chain      # Start local blockchain
yarn deploy     # Deploy contracts
yarn start      # Start frontend at http://localhost:3000
```

### 4. Testing
```bash
yarn test       # Run smart contract tests
```

## 📜 Contract Details
The `UniversityPayments` contract includes:
- Automatic refunds for overpayment.
- Ownership-based access control for service management.
- Transparent fund withdrawal system.

## 📦 Deployment Process
To deploy to a live network (e.g., Sepolia):
1. Configure your network in `packages/hardhat/hardhat.config.ts`.
2. Generate a deployer account or import a private key.
3. Run `yarn deploy --network sepolia`.

---
Built with 🏗 [Scaffold-ETH 2](https://scaffoldeth.io)