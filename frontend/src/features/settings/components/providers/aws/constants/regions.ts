// frontend/src/features/settings/components/providers/aws/constants/regions.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Regiões AWS organizadas por localização geográfica
 * Fonte: AWS Bedrock Documentation
 */

export interface AWSRegion {
  value: string;
  label: string;
}

export interface AWSRegionGroup {
  label: string;
  regions: AWSRegion[];
}

export const REGION_GROUPS: AWSRegionGroup[] = [
  {
    label: 'Estados Unidos',
    regions: [
      { value: 'us-east-1', label: 'Norte da Virgínia (us-east-1)' },
      { value: 'us-east-2', label: 'Ohio (us-east-2)' },
      { value: 'us-west-1', label: 'Norte da Califórnia (us-west-1)' },
      { value: 'us-west-2', label: 'Oregon (us-west-2)' }
    ]
  },
  {
    label: 'Ásia-Pacífico',
    regions: [
      { value: 'ap-south-1', label: 'Mumbai (ap-south-1)' },
      { value: 'ap-northeast-3', label: 'Osaka (ap-northeast-3)' },
      { value: 'ap-northeast-2', label: 'Seul (ap-northeast-2)' },
      { value: 'ap-southeast-1', label: 'Cingapura (ap-southeast-1)' },
      { value: 'ap-southeast-2', label: 'Sydney (ap-southeast-2)' },
      { value: 'ap-northeast-1', label: 'Tóquio (ap-northeast-1)' }
    ]
  },
  {
    label: 'Canadá',
    regions: [
      { value: 'ca-central-1', label: 'Central (ca-central-1)' }
    ]
  },
  {
    label: 'Europa',
    regions: [
      { value: 'eu-central-1', label: 'Frankfurt (eu-central-1)' },
      { value: 'eu-west-1', label: 'Irlanda (eu-west-1)' },
      { value: 'eu-west-2', label: 'Londres (eu-west-2)' },
      { value: 'eu-west-3', label: 'Paris (eu-west-3)' },
      { value: 'eu-north-1', label: 'Estocolmo (eu-north-1)' }
    ]
  },
  {
    label: 'América do Sul',
    regions: [
      { value: 'sa-east-1', label: 'São Paulo (sa-east-1)' }
    ]
  }
];

/**
 * Retorna todas as regiões em um array plano
 */
export const getAllRegions = (): AWSRegion[] => {
  return REGION_GROUPS.flatMap(group => group.regions);
};

/**
 * Busca uma região pelo valor
 */
export const findRegionByValue = (value: string): AWSRegion | undefined => {
  return getAllRegions().find(region => region.value === value);
};
