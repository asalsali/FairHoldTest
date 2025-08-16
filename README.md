# FairHold - Secure Escrow for Weddings & Rentals

FairHold is a transparent, milestone-based escrow system built on blockchain technology. It provides secure payment solutions for wedding services and rental deposits with automatic refund policies and dispute resolution.

## 🎯 Features

### Smart Contract Features
- **Milestone-based payments** - Release funds only when satisfied
- **Automatic refund policies** - Time-based cancellation windows
- **Dispute resolution** - Built-in mediation system
- **Change order support** - Vendor can request changes with payer approval
- **Auto-refund triggers** - Automatic refunds for rental deposits

### Preset Templates
- **Wedding Services** - 40% deposit, 20% samples, 40% completion
- **Rental Deposits** - 100% security deposit with auto-refund

### Web Application
- **Beautiful UI** - Modern, responsive design with no crypto jargon
- **Step-by-step creation** - Guided agreement setup process
- **Real-time tracking** - Monitor agreement progress and milestones
- **QR codes & magic links** - Easy sharing and access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Hardhat for smart contract development

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd FairHold
pnpm install
```

2. **Set up environment variables**
```bash
cp env.example .env.local
# Update .env.local with your configuration
```

3. **Deploy contracts locally**
```bash
# Start local blockchain
pnpm hardhat node

# In another terminal, deploy contracts
pnpm deploy:local
```

4. **Seed with sample data**
```bash
pnpm seed
```

5. **Start the web application**
```bash
pnpm dev
```

6. **Run tests**
```bash
pnpm test
```

## 📋 Commands

```bash
pnpm i && pnpm dev    # Install and start web app
pnpm test             # Run smart contract tests
pnpm deploy:local     # Deploy to local blockchain
pnpm seed             # Seed with sample data
pnpm demo             # Run end-to-end demo
```

## 🏗️ Architecture

### Smart Contracts
- **`FairHold.sol`** - Main escrow contract with all business logic
- **`MockUSDC.sol`** - Test USDC token for development

### Web Application
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **TypeScript** - Type-safe development

### Key Components
- **Agreement Creation** - Multi-step form with preset templates
- **Payment Flow** - Fund → Release → Complete
- **Progress Tracking** - Real-time milestone status
- **Demo Mode** - Interactive tutorial

## 🎨 Preset Configurations

### Wedding Services (Default)
```
Milestones:
- Deposit: 40% (T+24h)
- Samples Approved: 20% (EVENT-30d)
- Event Day Completion: 40% (EVENT)

Refund Policy:
- ≥30 days: 100% refund
- 8-29 days: 50% refund
- ≤7 days: 0% refund
- 24h cooling-off: 100% refund
```

### Rental Deposits
```
Milestones:
- Security Deposit: 100% (T+24h)
- Move-in Condition: 0% (MOVEIN+72h)
- Move-out Inspection: 0% (MOVEOUT+7d)
- Refund Deadline: 0% (MOVEOUT+14d)

Auto-refund: 14 days after move-out
```

## 🧪 Testing

The test suite covers all critical functionality:

- ✅ Agreement creation with presets
- ✅ Funding and milestone releases
- ✅ Cancellation with refund windows
- ✅ Change order requests and approvals
- ✅ Dispute creation and resolution
- ✅ Invariants (no over-release, proper percentages)

Run tests: `pnpm test`

## 🔗 Integrations (TODO)

### Dynamic Wallet
- Embedded wallet with email/OTP authentication
- `AuthProvider` + `useUser` hooks
- Seamless onboarding for non-crypto users

### Paymaster
- Gasless transactions
- `simulateGasless(tx)` + `submitGasless(tx)`
- Support for multiple paymaster providers

### Onramp Solutions
- **Coinbase Commerce** - Credit card payments
- **PayPal** - Traditional payment methods
- **FakeOnramp** - Development/testing component

## 🏆 Prize Callouts

### Dynamic Integration
- **Best Embedded Wallet Experience** - Dynamic's email/OTP flow eliminates crypto complexity
- **Seamless Onboarding** - Users can start using FairHold without any crypto knowledge
- **Enterprise Ready** - Dynamic's compliance and security features

### Zircuit Integration
- **Enhanced Security** - Zircuit's zk-proofs for additional verification
- **Privacy Features** - Optional privacy for sensitive financial data
- **Scalability** - Layer 2 solution for high-volume escrow transactions

### Optional Enhancements
- **Coinbase Commerce** - Credit card onramp for mass adoption
- **PayPal Integration** - Traditional payment method support
- **Multi-chain Support** - Deploy on multiple networks

## 📱 User Experience

### For Vendors
1. Create agreement with client details
2. Set milestones and payment schedule
3. Receive payments automatically when milestones are met
4. Request changes with client approval

### For Payers
1. Review agreement terms and refund policy
2. Fund escrow with USDC
3. Release payments when satisfied with work
4. Cancel anytime with automatic refund calculation

### Key Benefits
- **Transparency** - All terms and payments visible on blockchain
- **Security** - Funds held in smart contracts, not third parties
- **Fairness** - Automatic refund policies protect both parties
- **Simplicity** - No crypto knowledge required

## 🔒 Security Features

- **Reentrancy Protection** - Prevents double-spending attacks
- **Access Control** - Only authorized parties can perform actions
- **Invariant Checks** - Ensures mathematical correctness
- **Grace Periods** - Prevents premature milestone releases
- **Dispute Resolution** - Mediator can resolve conflicts

## 🚧 Development Roadmap

- [ ] Dynamic wallet integration
- [ ] Paymaster support for gasless transactions
- [ ] Coinbase Commerce onramp
- [ ] Multi-chain deployment
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**FairHold** - Making escrow fair, transparent, and accessible for everyone.
