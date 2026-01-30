// backend/src/services/ai/providers/__tests__/bedrock-region.test.ts
// Standards: docs/STANDARDS.md

import { getRegionPrefix } from '../bedrock';

describe('getRegionPrefix', () => {
  it('should return "us" for US regions', () => {
    expect(getRegionPrefix('us-east-1')).toBe('us');
    expect(getRegionPrefix('us-west-2')).toBe('us');
    expect(getRegionPrefix('us-west-1')).toBe('us');
    expect(getRegionPrefix('us-east-2')).toBe('us');
  });
  
  it('should return "eu" for EU regions', () => {
    expect(getRegionPrefix('eu-central-1')).toBe('eu');
    expect(getRegionPrefix('eu-west-1')).toBe('eu');
    expect(getRegionPrefix('eu-west-2')).toBe('eu');
    expect(getRegionPrefix('eu-north-1')).toBe('eu');
  });
  
  it('should return "apac" for APAC regions', () => {
    expect(getRegionPrefix('ap-southeast-1')).toBe('apac');
    expect(getRegionPrefix('ap-northeast-1')).toBe('apac');
    expect(getRegionPrefix('ap-south-1')).toBe('apac');
    expect(getRegionPrefix('ap-southeast-2')).toBe('apac');
    expect(getRegionPrefix('ap-northeast-2')).toBe('apac');
    expect(getRegionPrefix('ap-east-1')).toBe('apac');
  });
  
  it('should handle other regions correctly', () => {
    expect(getRegionPrefix('ca-central-1')).toBe('ca');
    expect(getRegionPrefix('sa-east-1')).toBe('sa');
    expect(getRegionPrefix('me-south-1')).toBe('me');
    expect(getRegionPrefix('af-south-1')).toBe('af');
  });
  
  it('should handle edge cases', () => {
    // Região com apenas um segmento (improvável, mas defensivo)
    expect(getRegionPrefix('us')).toBe('us');
    
    // Região com múltiplos segmentos
    expect(getRegionPrefix('us-gov-west-1')).toBe('us');
  });
});
