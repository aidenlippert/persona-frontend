import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useApp } from '../../context/AppContext';

interface UseCase {
  name: string;
  description: string;
  requirements: string[];
  icon: string;
}

const VerifyIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();
  const [useCases, setUseCases] = useState<{ [key: string]: UseCase }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUseCases, setFilteredUseCases] = useState<[string, UseCase][]>([]);

  // Load use cases data
  useEffect(() => {
    const loadUseCases = async () => {
      try {
        const useCasesData = await import('../../data/use-cases.json');
        setUseCases(useCasesData.default);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load use cases:', error);
        showNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load use cases data',
        });
        setLoading(false);
      }
    };

    loadUseCases();
  }, [showNotification]);

  // Filter use cases based on search
  useEffect(() => {
    const entries = Object.entries(useCases);
    
    if (searchTerm) {
      const filtered = entries.filter(([key, useCase]) =>
        useCase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        useCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUseCases(filtered);
    } else {
      setFilteredUseCases(entries);
    }
  }, [useCases, searchTerm]);

  const handleUseCaseSelect = (useCaseKey: string) => {
    navigate(`/verify/${useCaseKey}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading verification use cases...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-primary-600" />
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Verification Center
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Select a use case to verify the required credentials
        </p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search use cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {filteredUseCases.length} use cases available
        </div>
      </div>

      {/* Use Cases Grid */}
      {filteredUseCases.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No use cases found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUseCases.map(([key, useCase]) => (
            <div
              key={key}
              onClick={() => handleUseCaseSelect(key)}
              className="card hover:shadow-lg transition-shadow cursor-pointer border hover:border-primary-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{useCase.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {useCase.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {useCase.description}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>

              {/* Requirements */}
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Required Credentials ({useCase.requirements.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {useCase.requirements.map((requirement) => (
                    <span
                      key={requirement}
                      className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded"
                    >
                      {requirement.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>

              {/* Use Case ID */}
              <div className="mt-3 text-xs text-gray-500 font-mono">
                ID: {key}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">How Verification Works</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>Step 1:</strong> Select a verification use case from the list above.
          </p>
          <p>
            <strong>Step 2:</strong> Enter the DID of the person whose credentials you want to verify.
          </p>
          <p>
            <strong>Step 3:</strong> The system will check if they have the required credentials
            and request them to share the necessary proofs.
          </p>
          <p>
            <strong>Step 4:</strong> Review the shared credentials and verify their authenticity
            using zero-knowledge proofs.
          </p>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="font-medium">🔒 Privacy Protected</p>
            <p className="text-xs mt-1">
              All verification uses zero-knowledge proofs, ensuring that only the necessary
              information is revealed while keeping personal data private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyIndex;