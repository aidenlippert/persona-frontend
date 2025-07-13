import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

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

const Templates: React.FC = () => {
  const { state, showNotification } = useApp();
  const [templates, setTemplates] = useState<CredentialTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CredentialTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load credential templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Import the JSON data
        const templatesData = await import('../data/credential-templates.json');
        setTemplates(templatesData.default);
        setFilteredTemplates(templatesData.default);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load credential templates:', error);
        showNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load credential templates',
        });
        setLoading(false);
      }
    };

    loadTemplates();
  }, [showNotification]);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      all: 'All Templates',
      identity: 'Identity',
      professional: 'Professional',
      academic: 'Academic',
      financial: 'Financial',
      health: 'Health',
      location: 'Location',
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (!state.wallet.isConnected) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No wallet connected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please connect your Keplr wallet to access credential templates.
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
          You need to create a DID before using credential templates.
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
        <p className="mt-4 text-sm text-gray-500">Loading credential templates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-primary-600" />
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Credential Templates
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose a template to create verifiable credentials that can be used for various purposes
        </p>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field pl-10 appearance-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredTemplates.length} of {templates.length} templates
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="card hover:shadow-lg transition-shadow">
              {/* Template Header */}
              <div className="flex items-start space-x-3">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {template.title}
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full mt-1">
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                {template.description}
              </p>

              {/* Fields Count */}
              <div className="mt-4 text-xs text-gray-500">
                {template.fields.length} fields • {template.proofCapabilities.length} proof capabilities
              </div>

              {/* Use Cases */}
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Common Use Cases:</div>
                <div className="flex flex-wrap gap-1">
                  {template.useCases.slice(0, 3).map((useCase) => (
                    <span
                      key={useCase}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {useCase.replace('_', ' ')}
                    </span>
                  ))}
                  {template.useCases.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{template.useCases.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <Link
                  to={`/templates/${template.id}/fill`}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Create Credential</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">About Credential Templates</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>Credential Templates</strong> provide standardized formats for different types of
            verifiable credentials. Each template defines the required fields and validation rules
            for specific use cases.
          </p>
          <p>
            <strong>Key Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Standardized credential formats for interoperability</li>
            <li>Built-in validation and security measures</li>
            <li>Zero-knowledge proof capabilities for privacy</li>
            <li>Wide acceptance across different platforms and services</li>
          </ul>
          <p>
            After creating a credential from a template, you can generate zero-knowledge proofs
            to selectively reveal information without exposing the underlying data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Templates;