const { describe, test, expect } = require('@jest/globals');

// Mock the getRequirements logic
const getRequirementsForUseCase = (useCase) => {
  const useCaseRequirements = {
    "store": ["proof-of-age"],
    "bar": ["proof-of-age"],
    "hotel": ["proof-of-age", "location-proof"],
    "doctor": ["proof-of-age", "health-credential"],
    "bank": ["proof-of-age", "employment-verification", "financial-status"],
    "rental": ["employment-verification", "financial-status", "location-proof"],
    "employer": ["education-credential", "employment-verification"],
    "travel": ["health-credential", "financial-status", "location-proof"],
    "graduate_school": ["education-credential"],
    "investment": ["financial-status", "employment-verification"],
  };

  return useCaseRequirements[useCase] || ["proof-of-age"]; // Default fallback
};

const validateRequirementsRequest = (data) => {
  if (!data.did || typeof data.did !== 'string') {
    throw new Error('Missing or invalid DID');
  }
  if (!data.useCase || typeof data.useCase !== 'string') {
    throw new Error('Missing or invalid useCase');
  }
  return true;
};

describe('getRequirements API Logic', () => {
  test('should return correct requirements for store use case', () => {
    const requirements = getRequirementsForUseCase('store');
    expect(requirements).toEqual(['proof-of-age']);
  });

  test('should return correct requirements for bank use case', () => {
    const requirements = getRequirementsForUseCase('bank');
    expect(requirements).toEqual(['proof-of-age', 'employment-verification', 'financial-status']);
  });

  test('should return correct requirements for doctor use case', () => {
    const requirements = getRequirementsForUseCase('doctor');
    expect(requirements).toEqual(['proof-of-age', 'health-credential']);
  });

  test('should return correct requirements for hotel use case', () => {
    const requirements = getRequirementsForUseCase('hotel');
    expect(requirements).toEqual(['proof-of-age', 'location-proof']);
  });

  test('should return correct requirements for rental use case', () => {
    const requirements = getRequirementsForUseCase('rental');
    expect(requirements).toEqual(['employment-verification', 'financial-status', 'location-proof']);
  });

  test('should return correct requirements for employer use case', () => {
    const requirements = getRequirementsForUseCase('employer');
    expect(requirements).toEqual(['education-credential', 'employment-verification']);
  });

  test('should return correct requirements for travel use case', () => {
    const requirements = getRequirementsForUseCase('travel');
    expect(requirements).toEqual(['health-credential', 'financial-status', 'location-proof']);
  });

  test('should return correct requirements for graduate_school use case', () => {
    const requirements = getRequirementsForUseCase('graduate_school');
    expect(requirements).toEqual(['education-credential']);
  });

  test('should return correct requirements for investment use case', () => {
    const requirements = getRequirementsForUseCase('investment');
    expect(requirements).toEqual(['financial-status', 'employment-verification']);
  });

  test('should return default requirements for unknown use case', () => {
    const requirements = getRequirementsForUseCase('unknown_use_case');
    expect(requirements).toEqual(['proof-of-age']);
  });

  test('should return default requirements for empty string use case', () => {
    const requirements = getRequirementsForUseCase('');
    expect(requirements).toEqual(['proof-of-age']);
  });

  test('should return default requirements for null use case', () => {
    const requirements = getRequirementsForUseCase(null);
    expect(requirements).toEqual(['proof-of-age']);
  });

  test('should validate valid request data', () => {
    const validData = {
      did: 'did:persona:test123',
      useCase: 'store'
    };
    expect(() => validateRequirementsRequest(validData)).not.toThrow();
  });

  test('should reject request with missing DID', () => {
    const invalidData = {
      useCase: 'store'
    };
    expect(() => validateRequirementsRequest(invalidData)).toThrow('Missing or invalid DID');
  });

  test('should reject request with missing useCase', () => {
    const invalidData = {
      did: 'did:persona:test123'
    };
    expect(() => validateRequirementsRequest(invalidData)).toThrow('Missing or invalid useCase');
  });

  test('should reject request with invalid DID type', () => {
    const invalidData = {
      did: 123,
      useCase: 'store'
    };
    expect(() => validateRequirementsRequest(invalidData)).toThrow('Missing or invalid DID');
  });

  test('should reject request with invalid useCase type', () => {
    const invalidData = {
      did: 'did:persona:test123',
      useCase: 123
    };
    expect(() => validateRequirementsRequest(invalidData)).toThrow('Missing or invalid useCase');
  });

  test('should reject request with empty DID', () => {
    const invalidData = {
      did: '',
      useCase: 'store'
    };
    expect(() => validateRequirementsRequest(invalidData)).toThrow('Missing or invalid DID');
  });

  test('should reject request with empty useCase', () => {
    const invalidData = {
      did: 'did:persona:test123',
      useCase: ''
    };
    expect(() => validateRequirementsRequest(invalidData)).toThrow('Missing or invalid useCase');
  });
});

describe('Use Case Coverage', () => {
  test('should have requirements defined for all expected use cases', () => {
    const expectedUseCases = [
      'store', 'bar', 'hotel', 'doctor', 'bank', 'rental', 
      'employer', 'travel', 'graduate_school', 'investment'
    ];
    
    expectedUseCases.forEach(useCase => {
      const requirements = getRequirementsForUseCase(useCase);
      expect(requirements).toBeDefined();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });
  });

  test('should return unique template IDs for each use case', () => {
    const allUseCases = [
      'store', 'bar', 'hotel', 'doctor', 'bank', 'rental', 
      'employer', 'travel', 'graduate_school', 'investment'
    ];
    
    allUseCases.forEach(useCase => {
      const requirements = getRequirementsForUseCase(useCase);
      const uniqueRequirements = [...new Set(requirements)];
      expect(requirements).toEqual(uniqueRequirements);
    });
  });

  test('should only return valid template IDs', () => {
    const validTemplateIds = [
      'proof-of-age', 'employment-verification', 'education-credential',
      'financial-status', 'health-credential', 'location-proof'
    ];
    
    const allUseCases = [
      'store', 'bar', 'hotel', 'doctor', 'bank', 'rental', 
      'employer', 'travel', 'graduate_school', 'investment'
    ];
    
    allUseCases.forEach(useCase => {
      const requirements = getRequirementsForUseCase(useCase);
      requirements.forEach(templateId => {
        expect(validTemplateIds).toContain(templateId);
      });
    });
  });
});