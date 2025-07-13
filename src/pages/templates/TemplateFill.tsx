import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { issueCredential, handleApiError } from '../../lib/api';
import { generateCredentialId } from '../../lib/keplr';

interface CredentialTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  fields: TemplateField[];
  proofCapabilities: string[];
  useCases: string[];
}

interface TemplateField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}

const TemplateFill: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, showNotification } = useApp();
  
  const [template, setTemplate] = useState<CredentialTemplate | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCredential, setSubmittedCredential] = useState<any>(null);

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const templatesData = await import('../../data/credential-templates.json');
        const foundTemplate = templatesData.default.find((t: CredentialTemplate) => t.id === templateId);
        
        if (!foundTemplate) {
          showNotification({
            type: 'error',
            title: 'Template Not Found',
            message: `Template with ID "${templateId}" was not found.`,
          });
          navigate('/templates');
          return;
        }

        setTemplate(foundTemplate);
        
        // Initialize form data with default values
        const initialData: { [key: string]: any } = {};
        foundTemplate.fields.forEach((field: TemplateField) => {
          if (field.type === 'number') {
            initialData[field.name] = field.min || 0;
          } else if (field.type === 'date') {
            initialData[field.name] = '';
          } else if (field.type === 'select' && field.options) {
            initialData[field.name] = field.options[0]?.value || '';
          } else {
            initialData[field.name] = '';
          }
        });
        setFormData(initialData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load template:', error);
        showNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load template data',
        });
        navigate('/templates');
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId, navigate, showNotification]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    } else if (type === 'date') {
      processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!template) return false;

    const newErrors: { [key: string]: string } = {};

    template.fields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      if (field.type === 'number' && value !== '' && value !== undefined) {
        if (field.min !== undefined && value < field.min) {
          newErrors[field.name] = `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          newErrors[field.name] = `${field.label} must be at most ${field.max}`;
        }
      }

      if (field.type === 'text' && value && typeof value === 'string') {
        if (value.trim().length < 2) {
          newErrors[field.name] = `${field.label} must be at least 2 characters`;
        }
      }

      if (field.type === 'date' && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          newErrors[field.name] = `${field.label} must be a valid date`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.wallet.address || !state.currentDID || !template) {
      showNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet and create a DID first.',
      });
      return;
    }

    if (!validateForm()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors in the form.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const credentialId = generateCredentialId();
      
      // Prepare credential data based on template
      const claims: any = {
        ...formData,
        credentialType: template.id,
        issuanceDate: new Date().toISOString(),
        templateId: template.id,
        templateTitle: template.title,
      };

      // Add computed fields for age verification
      if (template.id === 'proof-of-age' && formData.birthYear) {
        const currentYear = new Date().getFullYear();
        const age = currentYear - formData.birthYear;
        claims.age = age;
        claims.isOver18 = age >= 18;
        claims.isOver21 = age >= 21;
      }

      const response = await issueCredential(
        state.wallet.address,
        credentialId,
        template.title,
        state.currentDID.id,
        claims
      );

      if (response.code === 0) {
        const newCredential = {
          id: credentialId,
          type: ['VerifiableCredential', template.title],
          issuer: state.wallet.address,
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: state.currentDID.id,
            ...claims,
          },
          templateId: template.id,
          templateTitle: template.title,
          is_revoked: false,
          issued_at: Math.floor(Date.now() / 1000),
        };

        dispatch({ type: 'ADD_CREDENTIAL', payload: newCredential });
        setSubmittedCredential(newCredential);

        showNotification({
          type: 'success',
          title: 'Credential Created',
          message: `Your ${template.title} credential has been successfully created!`,
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      showNotification({
        type: 'error',
        title: 'Credential Creation Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const hasError = !!errors[field.name];
    const fieldClasses = `input-field ${hasError ? 'border-red-300 focus:border-red-500' : ''}`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            placeholder={field.placeholder}
            className={fieldClasses}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={fieldClasses}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            className={fieldClasses}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            className={fieldClasses}
            required={field.required}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  if (!state.wallet.isConnected) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No wallet connected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please connect your Keplr wallet to create credentials.
        </p>
        <div className="mt-6">
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!state.currentDID) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No DID found</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to create a DID before creating credentials.
        </p>
        <div className="mt-6">
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Template not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested template could not be found.
        </p>
        <div className="mt-6">
          <Link to="/templates" className="btn-primary">
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">{template.icon}</div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Create {template.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {template.description}
        </p>
        <div className="mt-4">
          <Link
            to="/templates"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Templates
          </Link>
        </div>
      </div>

      {submittedCredential ? (
        /* Success State */
        <div className="card">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              Credential Created Successfully!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your {template.title} credential has been created and stored on the blockchain.
            </p>
          </div>

          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-3">Credential Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Type:</span>
                <span className="text-green-900 font-medium">{template.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Template ID:</span>
                <span className="text-green-900 font-mono text-xs">{template.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Subject:</span>
                <span className="text-green-900 font-mono text-xs">
                  {submittedCredential.credentialSubject.id}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => {
                setSubmittedCredential(null);
                setFormData({});
                // Reinitialize form data
                const initialData: { [key: string]: any } = {};
                template.fields.forEach((field: TemplateField) => {
                  if (field.type === 'number') {
                    initialData[field.name] = field.min || 0;
                  } else if (field.type === 'date') {
                    initialData[field.name] = '';
                  } else if (field.type === 'select' && field.options) {
                    initialData[field.name] = field.options[0]?.value || '';
                  } else {
                    initialData[field.name] = '';
                  }
                });
                setFormData(initialData);
              }}
              className="btn-secondary flex-1"
            >
              Create Another
            </button>
            <Link to="/generate" className="btn-primary flex-1 text-center">
              Generate Proof
            </Link>
          </div>
        </div>
      ) : (
        /* Form */
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {template.fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.name] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors[field.name]}
                  </p>
                )}
                {field.placeholder && !errors[field.name] && (
                  <p className="mt-1 text-xs text-gray-500">{field.placeholder}</p>
                )}
              </div>
            ))}

            {/* Privacy Notice */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">🔒 Privacy Notice</h4>
              <p className="text-sm text-yellow-800">
                This information will be stored in a verifiable credential on the blockchain.
                You can later generate zero-knowledge proofs to verify facts about yourself
                without revealing the underlying data.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Link to="/templates" className="btn-secondary flex-1 text-center">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <DocumentTextIcon className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Creating...' : 'Create Credential'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Template Info */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Category:</strong> {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
          </div>
          <div>
            <strong>Proof Capabilities:</strong> {template.proofCapabilities.join(', ')}
          </div>
          <div>
            <strong>Common Use Cases:</strong> {template.useCases.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateFill;