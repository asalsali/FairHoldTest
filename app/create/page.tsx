'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Heart, 
  Home, 
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface Milestone {
  name: string
  percentage: number
  deadline: string
}

interface FormData {
  vendorName: string
  vendorEmail: string
  vendorPhone: string
  vendorAddress: string
  payerName: string
  payerEmail: string
  payerPhone: string
  totalAmount: string
  eventDate: string
  description: string
  mediatorEmail: string
}

export default function CreateAgreement() {
  const searchParams = useSearchParams()
  const template = searchParams.get('template') || 'wedding'
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorAddress: '',
    payerName: '',
    payerEmail: '',
    payerPhone: '',
    totalAmount: '',
    eventDate: '',
    description: '',
    mediatorEmail: ''
  })

  const [milestones, setMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    if (template === 'wedding') {
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + 60)
      
      setMilestones([
        {
          name: 'Deposit',
          percentage: 40,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          name: 'Samples Approved',
          percentage: 20,
          deadline: new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          name: 'Event Day Completion',
          percentage: 40,
          deadline: eventDate.toISOString().split('T')[0]
        }
      ])
    } else {
      const moveInDate = new Date()
      moveInDate.setDate(moveInDate.getDate() + 7)
      
      setMilestones([
        {
          name: 'Security Deposit Funded',
          percentage: 100,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          name: 'Move-in Condition Submitted',
          percentage: 0,
          deadline: new Date(moveInDate.getTime() + 72 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          name: 'Move-out Inspection',
          percentage: 0,
          deadline: new Date(moveInDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          name: 'Refund Deadline',
          percentage: 0,
          deadline: new Date(moveInDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ])
    }
  }, [template])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string | number) => {
    setMilestones(prev => prev.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    ))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.vendorName && formData.vendorEmail && formData.payerName && formData.payerEmail)
      case 2:
        return !!(formData.totalAmount && formData.eventDate && formData.description)
      case 3:
        return milestones.every(m => m.name && m.percentage >= 0 && m.deadline)
      default:
        return true
    }
  }

  const canProceed = validateStep(currentStep)

  const handleSubmit = async () => {
    // TODO: Integrate with blockchain
    console.log('Creating agreement:', { formData, milestones, template })
    
    // Simulate agreement creation
    const agreementId = Math.floor(Math.random() * 1000000)
    
    // Show success and redirect
    alert(`Agreement created successfully! ID: ${agreementId}`)
    // Redirect to agreement page
  }

  const steps = [
    { number: 1, title: 'Party Information', icon: User },
    { number: 2, title: 'Agreement Details', icon: DollarSign },
    { number: 3, title: 'Milestones', icon: Calendar },
    { number: 4, title: 'Review & Create', icon: CheckCircle }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="ml-8 flex items-center">
              {template === 'wedding' ? (
                <Heart className="h-6 w-6 text-pink-500 mr-2" />
              ) : (
                <Home className="h-6 w-6 text-blue-500 mr-2" />
              )}
              <span className="text-lg font-semibold">
                Create {template === 'wedding' ? 'Wedding' : 'Rental'} Agreement
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-primary-500 bg-primary-500 text-white' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-300 bg-white text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Party Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Vendor Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Vendor Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Name *
                      </label>
                      <input
                        type="text"
                        value={formData.vendorName}
                        onChange={(e) => handleInputChange('vendorName', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Blossom Florals"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.vendorEmail}
                        onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
                        className="input-field"
                        placeholder="vendor@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.vendorPhone}
                        onChange={(e) => handleInputChange('vendorPhone', e.target.value)}
                        className="input-field"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={formData.vendorAddress}
                        onChange={(e) => handleInputChange('vendorAddress', e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="Business address"
                      />
                    </div>
                  </div>
                </div>

                {/* Payer Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Payer Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payer Name *
                      </label>
                      <input
                        type="text"
                        value={formData.payerName}
                        onChange={(e) => handleInputChange('payerName', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Alex & Kirsten"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.payerEmail}
                        onChange={(e) => handleInputChange('payerEmail', e.target.value)}
                        className="input-field"
                        placeholder="payer@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.payerPhone}
                        onChange={(e) => handleInputChange('payerPhone', e.target.value)}
                        className="input-field"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Agreement Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (USDC) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                      className="input-field pl-10"
                      placeholder="1500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {template === 'wedding' ? 'Event Date' : 'Move-in Date'} *
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="input-field"
                    rows={4}
                    placeholder={template === 'wedding' 
                      ? "Describe the wedding services (e.g., floral arrangements for ceremony and reception)"
                      : "Describe the rental property and terms"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mediator Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.mediatorEmail}
                    onChange={(e) => handleInputChange('mediatorEmail', e.target.value)}
                    className="input-field"
                    placeholder="mediator@example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Milestones</h2>
              <p className="text-gray-600">
                Configure payment milestones. The total percentage should equal 100%.
              </p>

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Milestone Name
                        </label>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Percentage (%)
                        </label>
                        <input
                          type="number"
                          value={milestone.percentage}
                          onChange={(e) => handleMilestoneChange(index, 'percentage', parseInt(e.target.value) || 0)}
                          className="input-field"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Deadline
                        </label>
                        <input
                          type="date"
                          value={milestone.deadline}
                          onChange={(e) => handleMilestoneChange(index, 'deadline', e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700">
                    Total Percentage: {milestones.reduce((sum, m) => sum + m.percentage, 0)}%
                    {milestones.reduce((sum, m) => sum + m.percentage, 0) !== 100 && 
                      ' (should equal 100%)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review & Create</h2>
              
              <div className="space-y-6">
                {/* Party Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Party Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Vendor</h4>
                      <p className="text-sm text-gray-600">{formData.vendorName}</p>
                      <p className="text-sm text-gray-600">{formData.vendorEmail}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Payer</h4>
                      <p className="text-sm text-gray-600">{formData.payerName}</p>
                      <p className="text-sm text-gray-600">{formData.payerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Agreement Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Agreement Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="font-medium">{formData.totalAmount} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Event Date:</span>
                      <span className="font-medium">{formData.eventDate}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Description:</span>
                      <p className="text-sm mt-1">{formData.description}</p>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Milestones</h3>
                  <div className="space-y-2">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{milestone.name}</span>
                          <span className="text-sm text-gray-600">
                            {milestone.percentage}% - {milestone.deadline}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund Policy */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Refund Policy</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      {template === 'wedding' 
                        ? "100% refund ≥30 days before event, 50% refund 8-29 days, 0% refund ≤7 days"
                        : "100% refund ≥30 days before move-in, 50% refund 8-29 days, 0% refund ≤7 days. Auto-refund 14 days after move-out."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn-success"
              >
                Create Agreement
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
