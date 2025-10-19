//payment calculator functionally
//econ major type math
import {
  FinancingOption,
  UserFinancialProfile,
  PaymentScheduleItem,
  FinancialTip
} from '../types/payment.types';


export class PaymentCalculator {
 
  //laon option
  calculateFinancing(
    vehiclePrice: number,
    downPayment: number,
    tradeInValue: number,
    termMonths: number,
    apr: number,
    creditScore: string
  ): FinancingOption {
   
    //calculate amount to finance
    const amountFinanced = vehiclePrice - downPayment - tradeInValue;
   
    //monthly interest rate
    const monthlyRate = apr / 100 / 12;
   
    //calculate monthly payment using amortization formula
    // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
    const monthlyPayment = monthlyRate === 0
      ? amountFinanced / termMonths
      : (amountFinanced * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
   
    //calculate total cost and interest
    const totalPaid = monthlyPayment * termMonths + downPayment;
    const totalInterest = totalPaid - vehiclePrice + tradeInValue;
   
    //estimate insurance and maintenance
    const monthlyInsurance = this.estimateInsurance(vehiclePrice, creditScore);
    const monthlyMaintenance = this.estimateMaintenance(vehiclePrice);
   
    const totalMonthly = monthlyPayment + monthlyInsurance + monthlyMaintenance;
   
    return {
      type: 'finance',
      vehiclePrice,
      downPayment,
      tradeInValue,
      amountFinanced,
      termMonths,
      apr,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      monthlyInsurance,
      monthlyMaintenance,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalCost: Math.round(totalPaid * 100) / 100,
      affordabilityScore: 0, // Will calculate later
      recommendationReason: ''
    };
  }


  //leasing option
  calculateLeasing(
    vehiclePrice: number,
    downPayment: number,
    termMonths: number,
    apr: number,
    residualValuePercent: number = 0.50 // 50% residual value typical for 36mo lease
  ): FinancingOption {
   
    const residualValue = vehiclePrice * residualValuePercent;
    const depreciationAmount = vehiclePrice - residualValue;
   
    //lease payment = (Depreciation + Interest) / Term
    const monthlyDepreciation = depreciationAmount / termMonths;
    const monthlyInterest = (vehiclePrice + residualValue) * (apr / 100 / 12) / 2;
    const monthlyPayment = monthlyDepreciation + monthlyInterest;
   
    //estimate costs
    const monthlyInsurance = this.estimateInsurance(vehiclePrice, 'good');
    const monthlyMaintenance = 50; // Usually covered under warranty
    const totalMonthly = monthlyPayment + monthlyInsurance + monthlyMaintenance;
   
    const totalPaid = (monthlyPayment * termMonths) + downPayment;
   
    return {
      type: 'lease',
      vehiclePrice,
      downPayment,
      tradeInValue: 0,
      amountFinanced: depreciationAmount,
      termMonths,
      apr,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      monthlyInsurance,
      monthlyMaintenance,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalInterest: Math.round(monthlyInterest * termMonths * 100) / 100,
      totalCost: Math.round(totalPaid * 100) / 100,
      residualValue: Math.round(residualValue * 100) / 100,
      mileageLimit: 12000 * (termMonths / 12), // 12k miles/year
      excessMileageFee: 0.25, // $0.25/mile
      affordabilityScore: 0,
      recommendationReason: ''
    };
  }


  //get apr credit score
  //annual percentage rate, cost of a loan or credit card
  getAPRForCreditScore(creditScore: string, isLease: boolean = false): number {
    const rates = {
      excellent: isLease ? 3.5 : 4.5,
      good: isLease ? 5.0 : 6.5,
      fair: isLease ? 7.5 : 9.5,
      building: isLease ? 10.0 : 12.5,
      unsure: isLease ? 7.5 : 9.5
    };
   
    return rates[creditScore as keyof typeof rates] || rates.fair;
  }


  ///car insurance
  private estimateInsurance(vehiclePrice: number, creditScore: string): number {
    const baseRate = vehiclePrice * 0.01 / 12; // 1% of vehicle price annually
   
    const creditMultiplier = {
      excellent: 0.8,
      good: 1.0,
      fair: 1.3,
      building: 1.6,
      unsure: 1.3
    };
   
    const multiplier = creditMultiplier[creditScore as keyof typeof creditMultiplier] || 1.0;
    return Math.round(baseRate * multiplier);
  }


  //estime monthly maintenance
  private estimateMaintenance(vehiclePrice: number): number {
    // Higher-end vehicles = higher maintenance
    if (vehiclePrice > 50000) return 150;
    if (vehiclePrice > 35000) return 100;
    if (vehiclePrice > 25000) return 75;
    return 50;
  }


  //afforadbility score, random estimates
  calculateAffordabilityScore(
    totalMonthly: number,
    monthlyIncome?: number,
    monthlyBudget?: number
  ): number {
    if (!monthlyIncome && !monthlyBudget) return 50; // Unknown
   
    const budgetToUse = monthlyBudget || (monthlyIncome ? monthlyIncome * 0.15 : 0);
   
    if (budgetToUse === 0) return 50;
   
    const ratio = totalMonthly / budgetToUse;
    // Ideal: payment is 80-100% of budget
    if (ratio >= 0.8 && ratio <= 1.0) return 100;
    if (ratio < 0.8) return Math.min(100, 100 - ((0.8 - ratio) * 100)); // Below budget
    if (ratio > 1.0) return Math.max(0, 100 - ((ratio - 1.0) * 200)); // Over budget
   
    return 50;
  }


  //generate payment schedule for loans
  generatePaymentSchedule(
    amountFinanced: number,
    apr: number,
    termMonths: number,
    startDate: Date = new Date()
  ): PaymentScheduleItem[] {
   
    const schedule: PaymentScheduleItem[] = [];
    const monthlyRate = apr / 100 / 12;
   
    const monthlyPayment = monthlyRate === 0
      ? amountFinanced / termMonths
      : (amountFinanced * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
   
    let remainingBalance = amountFinanced;
   
    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
     
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
     
      schedule.push({
        paymentNumber: i,
        date: paymentDate.toISOString().split('T')[0],
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        totalPayment: Math.round(monthlyPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
    }
   
    return schedule;
  }


  //personal finance tips for the user
  generateFinancialTips(
    userProfile: UserFinancialProfile,
    financeOption: FinancingOption,
    leaseOption: FinancingOption
  ): FinancialTip[] {
   
    const tips: FinancialTip[] = [];
   
    // Credit score tips
    if (userProfile.creditScore === 'building' || userProfile.creditScore === 'fair') {
      tips.push({
        category: 'credit',
        title: 'Improve Your Credit Score',
        description: `Your ${userProfile.creditScore} credit could save you $${this.calculateCreditSavings(financeOption.amountFinanced, financeOption.apr, financeOption.termMonths)} over the loan term with better credit.`,
        impact: 'high',
        actionable: true,
        action: 'Pay bills on time for 6 months to potentially improve your rate'
      });
    }
   
    //down payment details
    if (userProfile.downPayment && userProfile.downPayment < financeOption.vehiclePrice * 0.20) {
      const recommended20 = financeOption.vehiclePrice * 0.20;
      const savings = this.calculateDownPaymentSavings(
        financeOption.amountFinanced,
        financeOption.vehiclePrice - recommended20,
        financeOption.apr,
        financeOption.termMonths
      );
     
      tips.push({
        category: 'savings',
        title: 'Increase Your Down Payment',
        description: `Putting down 20% ($${recommended20.toFixed(0)}) could save you $${savings.toFixed(0)} in interest.`,
        impact: 'medium',
        actionable: true,
        action: `Save an additional $${(recommended20 - userProfile.downPayment).toFixed(0)}`
      });
    }
   
    //lease vs buy comparison
    const monthlySavings = financeOption.monthlyPayment - leaseOption.monthlyPayment;
    if (monthlySavings > 50) {
      tips.push({
        category: 'budget',
        title: 'Consider Leasing',
        description: `Leasing saves you $${monthlySavings.toFixed(0)}/month, which could fit your budget better.`,
        impact: 'medium',
        actionable: true,
        action: 'Compare lease terms carefully - best if you drive <12k miles/year'
      });
    }
   
    //term length tip
    if (financeOption.termMonths > 60) {
      tips.push({
        category: 'savings',
        title: 'Shorter Loan Term Saves Money',
        description: `A 60-month loan instead of ${financeOption.termMonths} months saves $${this.calculateTermSavings(financeOption.amountFinanced, financeOption.apr, financeOption.termMonths, 60).toFixed(0)} in interest.`,
        impact: 'high',
        actionable: true,
        action: 'Consider if your budget allows higher monthly payments'
      });
    }
    return tips;
  }


  //helper calculations for tips
  private calculateCreditSavings(amount: number, currentAPR: number, term: number): number {
    const betterAPR = Math.max(currentAPR - 3, 4.5); // 3% better rate
    const currentTotal = this.calculateTotalInterest(amount, currentAPR, term);
    const betterTotal = this.calculateTotalInterest(amount, betterAPR, term);
    return Math.round(currentTotal - betterTotal);
  }


  private calculateDownPaymentSavings(
    currentAmount: number,
    newAmount: number,
    apr: number,
    term: number
  ): number {
    const currentInterest = this.calculateTotalInterest(currentAmount, apr, term);
    const newInterest = this.calculateTotalInterest(newAmount, apr, term);
    return currentInterest - newInterest;
  }


  private calculateTermSavings(
    amount: number,
    apr: number,
    currentTerm: number,
    newTerm: number
  ): number {
    const currentInterest = this.calculateTotalInterest(amount, apr, currentTerm);
    const newInterest = this.calculateTotalInterest(amount, apr, newTerm);
    return currentInterest - newInterest;
  }


  private calculateTotalInterest(amount: number, apr: number, term: number): number {
    const monthlyRate = apr / 100 / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
                          (Math.pow(1 + monthlyRate, term) - 1);
    return (monthlyPayment * term) - amount;
  }
}
