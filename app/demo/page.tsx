'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Copy,
  QrCode,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Milestone {
  id: number
  name: string
  percentage: number
  deadline: string
  status: 'pending' | 'completed' | 'overdue'
  amount: number
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<'fund' | 'release' | 'complete'>('fund')
  const [isFunded, setIsFunded] = useState(false)
  const [isReleased, setIsReleased] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const agreement = {
    id: '123456',
    vendor: 'Blossom Florals',
    payer: 'Alex & Kirsten',
    total: 1500,
    funded: isFunded ? 1500 : 0,
    released: isReleased ? 600 : 0,
    eventDate: '2024-06-15',
    status: isReleased ? 'completed' : isFunded ? 'active' : 'pending',
    description: 'Wedding floral arrangements for ceremony and reception including bridal bouquet, bridesmaid bouquets, ceremony arch, and reception centerpieces.'
  }

  const milestones: Milestone[] = [
    {
      id: 0,
      name: 'Deposit',
      percentage: 40,
      deadline: '2024-01-20',
      status: isReleased ? 'completed' : 'pending',
      amount: 600
    },
    {
      id: 1,
      name: 'Samples Approved',
      percentage: 20,
      deadline: '2024-05-16',
      status: 'pending',
      amount: 300
    },
    {
      id: 2,
      name: 'Event Day Completion',
      percentage: 40,
      deadline: '2024-06-15',
      status: 'pending',
      amount: 600
    }
  ]

  const handleFund = () => {
    setIsFunded(true)
    setCurrentStep('release')
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleRelease = () => {
    setIsReleased(true)
    setCurrentStep('complete')
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Show toast notification
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
            <div className="flex items-center">
              <Heart className="h-6 w-6 text-pink-500 mr-2" />
              <span className="text-lg font-semibold">Demo: Wedding Agreement</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Agreement Overview */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {agreement.vendor} × {agreement.payer}
              </h1>
              <p className="text-gray-600 mt-1">Agreement #{agreement.id}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                ${agreement.total} USDC
              </div>
              <div className="text-sm text-gray-500">
                {agreement.status === 'completed' ? 'Completed' : 
                 agreement.status === 'active' ? 'Active' : 'Pending Funding'}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Funded</div>
              <div className="text-xl font-semibold">${agreement.funded} USDC</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Released</div>
              <div className="text-xl font-semibold">${agreement.released} USDC</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Event Date</div>
              <div className="text-xl font-semibold">{agreement.eventDate}</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">{agreement.description}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Progress</h2>
          
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  milestone.status === 'completed' ? 'border-green-500 bg-green-500 text-white' :
                  milestone.status === 'overdue' ? 'border-red-500 bg-red-500 text-white' :
                  'border-gray-300 bg-white text-gray-500'
                }`}>
                  {milestone.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : milestone.status === 'overdue' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                      <p className="text-sm text-gray-500">Due: {milestone.deadline}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${milestone.amount} USDC</div>
                      <div className="text-sm text-gray-500">{milestone.percentage}%</div>
                    </div>
                  </div>
                  {milestone.status === 'completed' && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ Released on {new Date().toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Steps */}
        {currentStep === 'fund' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: Fund the Agreement</h2>
            <p className="text-gray-600 mb-6">
              The payer needs to fund the agreement with {agreement.total} USDC before any milestones can be released.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">Refund Policy</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 100% refund if canceled ≥30 days before event</li>
                <li>• 50% refund if canceled 8-29 days before event</li>
                <li>• 0% refund if canceled ≤7 days before event</li>
                <li>• 24-hour cooling-off period with 100% refund</li>
              </ul>
            </div>

            <button
              onClick={handleFund}
              className="btn-primary text-lg px-8 py-3 w-full"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Fund Agreement with {agreement.total} USDC
            </button>
          </motion.div>
        )}

        {currentStep === 'release' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2: Release Milestone</h2>
            <p className="text-gray-600 mb-6">
              The payer can now release the first milestone payment to the vendor.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">Agreement Funded Successfully!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {agreement.total} USDC has been transferred to the escrow contract.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Release Deposit Milestone</h3>
              <p className="text-sm text-gray-600 mb-4">
                Release ${milestones[0].amount} USDC to {agreement.vendor} for the deposit payment.
              </p>
              <button
                onClick={handleRelease}
                className="btn-success"
              >
                Release ${milestones[0].amount} USDC
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 3: Milestone Released</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">Milestone Released Successfully!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                ${milestones[0].amount} USDC has been transferred to {agreement.vendor}.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Agreement Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agreement ID:</span>
                    <span className="font-mono">{agreement.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span>${agreement.total} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Funded:</span>
                    <span>${agreement.funded} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Released:</span>
                    <span>${agreement.released} USDC</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => copyToClipboard(agreement.id)}
                    className="w-full btn-secondary text-sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Agreement ID
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Blockchain
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="btn-primary">
                Create Your Own Agreement
              </Link>
            </div>
          </motion.div>
        )}

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -10,
                  opacity: 1
                }}
                animate={{
                  y: window.innerHeight + 10,
                  opacity: 0,
                  rotate: 360
                }}
                transition={{
                  duration: 3,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
