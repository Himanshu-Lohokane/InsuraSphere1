export interface Policy {
  id: string;
  provider: string;
  type: string;
  premium: number;
  coverage: number;
  term?: number;
  claimSettlementRatio?: number;
  benefits: string[];
  addOns: string[];
  goals?: string[];
  eligibility: {
    minAge: number;
    maxAge: number;
  };
  status: 'active' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  description?: string;
  matchScore?: number;
}

export interface UserPreferences {
  age: number;
  income: number;
  occupation: string;
  familySize: number;
  riskTolerance: number;
  goals: string[];
} 