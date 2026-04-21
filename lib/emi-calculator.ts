export interface AmortizationEntry {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
  extraPayment?: number;
}

export interface LumpSumPayment {
  month: number;
  amount: number;
}

export interface LoanDetails {
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  processingFee?: number;
  taxInsurance?: number;
}

export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalAmount: number;
  processingFeeCost: number;
  totalLoanCost: number;
}

export interface PartPaymentResult {
  newEMI: number;
  newTenure: number;
  interestSaved: number;
  timeSaved: number;
  newSchedule: AmortizationEntry[];
}

/**
 * Calculate EMI using the formula:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * Where:
 * P = principal
 * r = monthly interest rate
 * n = number of months
 */
export function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRate === 0) return principal / months;
  
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, months);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  
  return Math.round(emi * 100) / 100;
}

/**
 * Generate amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = [];
  const emi = calculateEMI(principal, annualRate, months);
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;

  for (let month = 1; month <= months; month++) {
    const interest = balance * monthlyRate;
    const principalPaid = emi - interest;
    balance = Math.max(0, balance - principalPaid);

    schedule.push({
      month,
      emi: Math.round(emi * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Generate amortization schedule with lump sum prepayments.
 * Tenure stays FIXED. EMI is recalculated (reduced) after each lump sum payment.
 */
export function generateAmortizationScheduleWithLumpSums(
  principal: number,
  annualRate: number,
  months: number,
  lumpSums: LumpSumPayment[]
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = [];
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  // Start with the initial EMI for the full tenure
  let currentEMI = calculateEMI(principal, annualRate, months);

  // Aggregate lump sums by month
  const lumpSumMap = new Map<number, number>();
  for (const ls of lumpSums) {
    lumpSumMap.set(ls.month, (lumpSumMap.get(ls.month) || 0) + ls.amount);
  }

  for (let month = 1; month <= months; month++) {
    if (balance <= 0) break;

    // Step 1: Calculate interest and principal for this month using current EMI
    const interest = balance * monthlyRate;
    let principalPaid = currentEMI - interest;

    // Guard: if remaining balance is less than principal portion, cap it
    if (principalPaid > balance) {
      principalPaid = balance;
    }

    // Step 2: Subtract principal from balance
    balance = Math.max(0, balance - principalPaid);

    // Step 3: Apply lump sum (if any) AFTER regular EMI
    const extra = lumpSumMap.get(month) || 0;
    let actualExtra = 0;
    if (extra > 0 && balance > 0) {
      actualExtra = Math.min(extra, balance);
      balance = Math.max(0, balance - actualExtra);

      // Step 4: Recalculate EMI using remaining balance and remaining months
      // (tenure stays fixed, EMI reduces)
      const remainingMonths = months - month;
      if (remainingMonths > 0 && balance > 0) {
        currentEMI = calculateEMI(balance, annualRate, remainingMonths);
      }
    }

    schedule.push({
      month,
      emi: Math.round(currentEMI * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      extraPayment: Math.round(actualExtra * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Calculate total interest payable
 */
export function calculateTotalInterest(principal: number, annualRate: number, months: number): number {
  const emi = calculateEMI(principal, annualRate, months);
  const totalAmount = emi * months;
  return Math.round((totalAmount - principal) * 100) / 100;
}

/**
 * Calculate complete EMI result
 */
export function calculateEMIResult(details: LoanDetails): EMIResult {
  const { loanAmount, interestRate, tenureMonths, processingFee = 0, taxInsurance = 0 } = details;
  
  const emi = calculateEMI(loanAmount, interestRate, tenureMonths);
  const totalInterest = calculateTotalInterest(loanAmount, interestRate, tenureMonths);
  const totalAmount = loanAmount + totalInterest;
  const processingFeeCost = (loanAmount * processingFee) / 100;
  const totalLoanCost = totalAmount + processingFeeCost + taxInsurance;

  return {
    emi,
    totalInterest,
    totalAmount,
    processingFeeCost,
    totalLoanCost,
  };
}

/**
 * Apply part payment to loan
 */
export function applyPartPayment(
  principal: number,
  annualRate: number,
  months: number,
  partPayment: number,
  reduceType: 'emi' | 'tenure',
  currentMonth: number = 0
): PartPaymentResult {
  const originalEMI = calculateEMI(principal, annualRate, months);
  const originalTotalInterest = calculateTotalInterest(principal, annualRate, months);
  
  // Calculate remaining balance after current month
  const schedule = generateAmortizationSchedule(principal, annualRate, months);
  const remainingBalance = currentMonth > 0 && currentMonth <= schedule.length 
    ? schedule[currentMonth - 1].balance 
    : principal;
  
  const newPrincipal = Math.max(0, remainingBalance - partPayment);
  const remainingMonths = months - currentMonth;
  
  let newEMI: number;
  let newTenure: number;
  let newSchedule: AmortizationEntry[];

  if (reduceType === 'emi') {
    // Keep same tenure, reduce EMI
    newTenure = remainingMonths;
    newEMI = calculateEMI(newPrincipal, annualRate, remainingMonths);
    newSchedule = generateAmortizationSchedule(newPrincipal, annualRate, remainingMonths);
  } else {
    // Keep same EMI, reduce tenure
    newEMI = originalEMI;
    const monthlyRate = annualRate / 12 / 100;
    
    if (monthlyRate === 0) {
      newTenure = Math.ceil(newPrincipal / newEMI);
    } else {
      // Calculate new tenure: n = log(EMI / (EMI - P*r)) / log(1+r)
      const numerator = Math.log(newEMI / (newEMI - newPrincipal * monthlyRate));
      const denominator = Math.log(1 + monthlyRate);
      newTenure = Math.ceil(numerator / denominator);
    }
    
    newSchedule = generateAmortizationSchedule(newPrincipal, annualRate, newTenure);
  }

  const newTotalInterest = calculateTotalInterest(newPrincipal, annualRate, newTenure);
  const originalRemainingInterest = schedule.slice(currentMonth).reduce((sum, entry) => sum + entry.interest, 0);
  const interestSaved = originalRemainingInterest - newTotalInterest;
  const timeSaved = remainingMonths - newTenure;

  return {
    newEMI,
    newTenure,
    interestSaved: Math.max(0, Math.round(interestSaved * 100) / 100),
    timeSaved: Math.max(0, timeSaved),
    newSchedule,
  };
}

/**
 * Get yearly breakdown of principal and interest
 */
export function getYearlyBreakdown(schedule: AmortizationEntry[]): Array<{
  year: number;
  principal: number;
  interest: number;
}> {
  const yearlyData: Map<number, { principal: number; interest: number }> = new Map();

  schedule.forEach((entry) => {
    const year = Math.ceil(entry.month / 12);
    const existing = yearlyData.get(year) || { principal: 0, interest: 0 };
    yearlyData.set(year, {
      principal: existing.principal + entry.principal,
      interest: existing.interest + entry.interest,
    });
  });

  return Array.from(yearlyData.entries()).map(([year, data]) => ({
    year,
    principal: Math.round(data.principal * 100) / 100,
    interest: Math.round(data.interest * 100) / 100,
  }));
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Step-Up/Step-Down EMI calculation
 */
export interface StepEMIConfig {
  principal: number;
  annualRate: number;
  tenureMonths: number;
  stepPercentage: number; // positive for step-up, negative for step-down
  stepIntervalYears: number;
}

export interface StepEMIResult {
  schedule: Array<AmortizationEntry & { year: number }>;
  totalInterest: number;
  totalAmount: number;
  emiByYear: Array<{ year: number; emi: number }>;
}

export function calculateStepEMI(config: StepEMIConfig): StepEMIResult {
  const { principal, annualRate, tenureMonths, stepPercentage, stepIntervalYears } = config;
  const monthlyRate = annualRate / 12 / 100;
  const stepIntervalMonths = stepIntervalYears * 12;
  
  let balance = principal;
  let currentEMI = calculateEMI(principal, annualRate, tenureMonths);
  const schedule: Array<AmortizationEntry & { year: number }> = [];
  const emiByYear: Array<{ year: number; emi: number }> = [];
  let totalInterest = 0;

  for (let month = 1; month <= tenureMonths && balance > 0; month++) {
    const year = Math.ceil(month / 12);
    
    // Apply step adjustment at interval boundaries
    if (month > 1 && (month - 1) % stepIntervalMonths === 0) {
      currentEMI = currentEMI * (1 + stepPercentage / 100);
    }
    
    // Track EMI by year
    if (month % 12 === 1 || month === 1) {
      emiByYear.push({ year, emi: Math.round(currentEMI * 100) / 100 });
    }

    const interest = balance * monthlyRate;
    let principalPaid = currentEMI - interest;
    
    // Handle last payment
    if (principalPaid > balance) {
      principalPaid = balance;
    }
    
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;

    schedule.push({
      month,
      year,
      emi: Math.round(currentEMI * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return {
    schedule,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round((principal + totalInterest) * 100) / 100,
    emiByYear,
  };
}

/**
 * Variable Interest Rate calculation
 */
export interface RateChange {
  fromMonth: number;
  newRate: number;
}

export interface VariableRateResult {
  schedule: Array<AmortizationEntry & { rate: number }>;
  totalInterest: number;
  totalAmount: number;
  emiChanges: Array<{ month: number; emi: number; rate: number }>;
}

export function calculateVariableRateEMI(
  principal: number,
  initialRate: number,
  tenureMonths: number,
  rateChanges: RateChange[]
): VariableRateResult {
  const sortedChanges = [...rateChanges].sort((a, b) => a.fromMonth - b.fromMonth);
  
  let balance = principal;
  let currentRate = initialRate;
  let remainingMonths = tenureMonths;
  let currentEMI = calculateEMI(principal, initialRate, tenureMonths);
  
  const schedule: Array<AmortizationEntry & { rate: number }> = [];
  const emiChanges: Array<{ month: number; emi: number; rate: number }> = [
    { month: 1, emi: Math.round(currentEMI * 100) / 100, rate: initialRate }
  ];
  let totalInterest = 0;

  for (let month = 1; month <= tenureMonths && balance > 0; month++) {
    // Check for rate change
    const rateChange = sortedChanges.find(rc => rc.fromMonth === month);
    if (rateChange) {
      currentRate = rateChange.newRate;
      remainingMonths = tenureMonths - month + 1;
      currentEMI = calculateEMI(balance, currentRate, remainingMonths);
      emiChanges.push({ 
        month, 
        emi: Math.round(currentEMI * 100) / 100, 
        rate: currentRate 
      });
    }

    const monthlyRate = currentRate / 12 / 100;
    const interest = balance * monthlyRate;
    let principalPaid = currentEMI - interest;
    
    if (principalPaid > balance) {
      principalPaid = balance;
    }
    
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;

    schedule.push({
      month,
      emi: Math.round(currentEMI * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      rate: currentRate,
    });
  }

  return {
    schedule,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round((principal + totalInterest) * 100) / 100,
    emiChanges,
  };
}

/**
 * Foreclosure Calculator
 */
export interface ForeclosureResult {
  foreclosureMonth: number;
  remainingPrincipal: number;
  foreclosureAmount: number;
  interestSaved: number;
  monthsSaved: number;
  paidPrincipal: number;
  paidInterest: number;
  totalPaidTillForeclosure: number;
}

export function calculateForeclosure(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  foreclosureMonth: number,
  foreclosureCharge: number = 0 // percentage of remaining principal
): ForeclosureResult {
  const schedule = generateAmortizationSchedule(principal, annualRate, tenureMonths);
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  
  // Get remaining principal at foreclosure month
  const entryBeforeForeclosure = schedule[foreclosureMonth - 1];
  const remainingPrincipal = entryBeforeForeclosure?.balance || principal;
  
  // Calculate paid amounts till foreclosure
  const paidPrincipal = principal - remainingPrincipal;
  const paidInterest = schedule
    .slice(0, foreclosureMonth)
    .reduce((sum, entry) => sum + entry.interest, 0);
  
  // Calculate total interest if loan was continued
  const totalInterestIfContinued = schedule.reduce((sum, entry) => sum + entry.interest, 0);
  
  // Interest saved is remaining interest that won't be paid
  const remainingInterest = schedule
    .slice(foreclosureMonth)
    .reduce((sum, entry) => sum + entry.interest, 0);
  
  // Foreclosure amount = remaining principal + foreclosure charges
  const foreclosureChargeAmount = (remainingPrincipal * foreclosureCharge) / 100;
  const foreclosureAmount = remainingPrincipal + foreclosureChargeAmount;
  
  const totalPaidTillForeclosure = (emi * foreclosureMonth) + foreclosureAmount;
  const monthsSaved = tenureMonths - foreclosureMonth;

  return {
    foreclosureMonth,
    remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
    foreclosureAmount: Math.round(foreclosureAmount * 100) / 100,
    interestSaved: Math.round(remainingInterest * 100) / 100,
    monthsSaved,
    paidPrincipal: Math.round(paidPrincipal * 100) / 100,
    paidInterest: Math.round(paidInterest * 100) / 100,
    totalPaidTillForeclosure: Math.round(totalPaidTillForeclosure * 100) / 100,
  };
}
