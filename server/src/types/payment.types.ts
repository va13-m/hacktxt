
export interface VehicleFinanceOption {
  vehicleId: string;
  vehicleName: string;
  msrp: number;
  matchPercentage: number;
}

export interface UserFinancialProfile {
  monthlyIncome?: number;
  creditScore?: string;
  creditConfidence?: 'high' | 'medium' | 'low' | 'unsure';
  downPayment?: number;
  monthlyBudget?: number;
  employmentStatus?: string;
  hasTradeIn?: boolean;
  tradeInValue?: number;
}

export interface FinancingOption {
  type: 'finance' | 'lease';
  
  // Loan/Lease details
  vehiclePrice: number;
  downPayment: number;
  tradeInValue?: number;
  amountFinanced: number;
  
  // Terms
  termMonths: number;
  apr: number;
  
  // Monthly breakdown
  monthlyPayment: number;
  monthlyInsurance: number;
  monthlyMaintenance: number;
  totalMonthly: number;
  
  // Total costs
  totalInterest: number;
  totalCost: number;
  
  // Lease specific
  residualValue?: number;
  mileageLimit?: number;
  excessMileageFee?: number;
  
  // Comparison
  affordabilityScore: number; // 0-100
  recommendationReason: string;
}

export interface PaymentSimulation {
  userId: string;
  vehicleId: string;
  vehicleName: string;
  msrp: number;
  
  userProfile: UserFinancialProfile;
  
  financeOption: FinancingOption;
  leaseOption: FinancingOption;
  
  recommendation: 'finance' | 'lease';
  reasonForRecommendation: string[];
  
  tips: FinancialTip[];
  
  // Payment schedule
  paymentSchedule: PaymentScheduleItem[];
  
  createdAt: Date;
}

export interface PaymentScheduleItem {
  paymentNumber: number;
  date: string;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface FinancialTip {
  category: 'savings' | 'credit' | 'budget' | 'timing';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: string;
}

// Nessie API Types
export interface NessieCustomer {
  _id: string;
  first_name: string;
  last_name: string;
  address: {
    street_number: string;
    street_name: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface NessieAccount {
  _id: string;
  type: string;
  nickname: string;
  rewards: number;
  balance: number;
  customer_id: string;
}

export interface NessiePurchase {
  merchant_id: string;
  medium: string;
  purchase_date: string;
  amount: number;
  status: string;
  description?: string;
}