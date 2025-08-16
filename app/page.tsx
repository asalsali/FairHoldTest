export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FairHold Escrow System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Secure escrow for weddings and rentals
        </p>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Smart Contracts</h2>
            <p className="text-gray-600 mb-4">
              ✅ FairHold.sol - Main escrow contract<br/>
              ✅ MockUSDC.sol - Test USDC token<br/>
              ✅ All tests passing (5/5)
            </p>
            <div className="text-sm text-gray-500">
              Contract Addresses:<br/>
              MockUSDC: 0x5FbDB2315678afecb367f032d93F642f64180aa3<br/>
              FairHold: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Web Application</h2>
            <p className="text-gray-600">
              🚧 Under development - Basic structure complete<br/>
              📱 Responsive design with Tailwind CSS<br/>
              🔗 Template selection (Wedding/Rental)<br/>
              💳 Mock payment integration
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            <div className="text-left text-sm space-y-2">
              <div>1. <code className="bg-gray-100 px-2 py-1 rounded">npx hardhat test</code> - Run tests</div>
              <div>2. <code className="bg-gray-100 px-2 py-1 rounded">npm run demo</code> - End-to-end demo</div>
              <div>3. <code className="bg-gray-100 px-2 py-1 rounded">npm run seed</code> - Create sample agreement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
