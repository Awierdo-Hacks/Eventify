'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import AccountTypeSelect from './AccountTypeSelect';
import CustomerBasicInfo from './CustomerBasicInfo';
import ProviderBusinessInfo from './ProviderBusinessInfo';
import ProviderContactInfo from './ProviderContactInfo';
import ProviderPortfolio from './ProviderPortfolio';
import RegistrationComplete from './RegistrationComplete';

type AccountType = 'CUSTOMER' | 'PROVIDER' | null;

interface CustomerData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ProviderBusinessData {
  businessName: string;
  category: string;
  description: string;
  location: string;
  priceRange: string;
}

interface ProviderContactData {
  contactName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface ProviderPortfolioData {
  profileImage: File | null;
  profileImagePreview: string;
  portfolioImages: File[];
  portfolioImagePreviews: string[];
  services: { name: string; description: string; priceFrom: string; priceTo: string }[];
}

// Step definitions for each flow
const CUSTOMER_STEPS = ['Type kiezen', 'Gegevens invullen'];
const PROVIDER_STEPS = ['Type kiezen', 'Bedrijfsinfo', 'Contactgegevens', 'Portfolio & Diensten'];

export default function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Customer state
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Provider state
  const [providerBusiness, setProviderBusiness] = useState<ProviderBusinessData>({
    businessName: '',
    category: '',
    description: '',
    location: '',
    priceRange: '',
  });

  const [providerContact, setProviderContact] = useState<ProviderContactData>({
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [providerPortfolio, setProviderPortfolio] = useState<ProviderPortfolioData>({
    profileImage: null,
    profileImagePreview: '',
    portfolioImages: [],
    portfolioImagePreviews: [],
    services: [],
  });

  const steps = accountType === 'PROVIDER' ? PROVIDER_STEPS : CUSTOMER_STEPS;
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const completeName =
    accountType === 'CUSTOMER'
      ? customerData.firstName
      : providerContact.contactName || providerBusiness.businessName;

  // ======== VALIDATION ========

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!accountType) {
        newErrors.accountType = 'Kies een account type';
      }
    }

    if (accountType === 'CUSTOMER' && currentStep === 1) {
      if (!customerData.firstName.trim()) newErrors.firstName = 'Voornaam is verplicht';
      if (!customerData.lastName.trim()) newErrors.lastName = 'Achternaam is verplicht';
      if (!customerData.email.trim()) {
        newErrors.email = 'E-mail is verplicht';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
        newErrors.email = 'Ongeldig e-mailadres';
      }
      if (!customerData.password) {
        newErrors.password = 'Wachtwoord is verplicht';
      } else if (customerData.password.length < 8) {
        newErrors.password = 'Minimaal 8 tekens';
      }
      if (customerData.password !== customerData.confirmPassword) {
        newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
      }
    }

    if (accountType === 'PROVIDER') {
      if (currentStep === 1) {
        if (!providerBusiness.businessName.trim()) newErrors.businessName = 'Bedrijfsnaam is verplicht';
        if (!providerBusiness.category) newErrors.category = 'Selecteer een categorie';
        if (!providerBusiness.location.trim()) newErrors.location = 'Locatie is verplicht';
        if (!providerBusiness.priceRange) newErrors.priceRange = 'Selecteer een prijsklasse';
        if (!providerBusiness.description.trim()) {
          newErrors.description = 'Beschrijving is verplicht';
        } else if (providerBusiness.description.trim().length < 50) {
          newErrors.description = 'Minimaal 50 karakters';
        }
      }

      if (currentStep === 2) {
        if (!providerContact.contactName.trim()) newErrors.contactName = 'Contactpersoon is verplicht';
        if (!providerContact.email.trim()) {
          newErrors.email = 'E-mail is verplicht';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerContact.email)) {
          newErrors.email = 'Ongeldig e-mailadres';
        }
        if (!providerContact.phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht';
        if (!providerContact.password) {
          newErrors.password = 'Wachtwoord is verplicht';
        } else if (providerContact.password.length < 8) {
          newErrors.password = 'Minimaal 8 tekens';
        }
        if (providerContact.password !== providerContact.confirmPassword) {
          newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
        }
      }

      if (currentStep === 3) {
        if (providerPortfolio.services.length === 0) {
          newErrors.services = 'Voeg minimaal één dienst toe';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ======== FILE UPLOAD ========

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Upload mislukt');
    }
    const data = await response.json();
    return data.url;
  };

  // ======== SUBMIT ========

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (accountType === 'CUSTOMER') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountType: 'CUSTOMER',
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            dateOfBirth: customerData.dateOfBirth || null,
            email: customerData.email,
            password: customerData.password,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registratie mislukt');
        setIsComplete(true);
      } else {
        // Upload images first
        let profileImageUrl = '';
        const portfolioImageUrls: string[] = [];

        if (providerPortfolio.profileImage) {
          profileImageUrl = await uploadFile(providerPortfolio.profileImage);
        }

        for (const file of providerPortfolio.portfolioImages) {
          const url = await uploadFile(file);
          portfolioImageUrls.push(url);
        }

        // Submit provider registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountType: 'PROVIDER',
            businessName: providerBusiness.businessName,
            category: providerBusiness.category,
            description: providerBusiness.description,
            location: providerBusiness.location,
            priceRange: providerBusiness.priceRange,
            contactName: providerContact.contactName,
            email: providerContact.email,
            phone: providerContact.phone,
            password: providerContact.password,
            profileImage: profileImageUrl || null,
            portfolioImages: portfolioImageUrls,
            services: providerPortfolio.services.map((s) => ({
              name: s.name,
              description: s.description || null,
              priceFrom: parseFloat(s.priceFrom) || 0,
              priceTo: s.priceTo ? parseFloat(s.priceTo) : null,
            })),
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registratie mislukt');
        setIsComplete(true);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Er is iets misgegaan';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ======== NAVIGATION ========

  const handleNext = () => {
    if (!validateStep()) return;

    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setErrors({});
    }
  };

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setErrors({});
  };

  // ======== RENDER ========

  if (isComplete) {
    return <RegistrationComplete accountType={accountType!} name={completeName} />;
  }

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <AccountTypeSelect
          selected={accountType}
          onSelect={handleAccountTypeSelect}
        />
      );
    }

    if (accountType === 'CUSTOMER') {
      return (
        <CustomerBasicInfo
          data={customerData}
          onChange={setCustomerData}
          errors={errors}
        />
      );
    }

    if (accountType === 'PROVIDER') {
      switch (currentStep) {
        case 1:
          return (
            <ProviderBusinessInfo
              data={providerBusiness}
              onChange={setProviderBusiness}
              errors={errors}
            />
          );
        case 2:
          return (
            <ProviderContactInfo
              data={providerContact}
              onChange={setProviderContact}
              errors={errors}
            />
          );
        case 3:
          return (
            <ProviderPortfolio
              data={providerPortfolio}
              onChange={setProviderPortfolio}
              errors={errors}
              businessName={providerBusiness.businessName}
              category={providerBusiness.category}
              location={providerBusiness.location}
              priceRange={providerBusiness.priceRange}
              description={providerBusiness.description}
            />
          );
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    index < currentStep
                      ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white'
                      : index === currentStep
                      ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span
                  className={`text-xs mt-1.5 hidden sm:block ${
                    index <= currentStep ? 'text-purple-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors ${
                    index < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Submit Error */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center"
        >
          {submitError}
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
            currentStep === 0
              ? 'opacity-0 pointer-events-none'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Vorige
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting || (currentStep === 0 && !accountType)}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
            isSubmitting || (currentStep === 0 && !accountType)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/25'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Bezig met registreren...
            </>
          ) : isLastStep ? (
            <>
              Account aanmaken
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Volgende
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
