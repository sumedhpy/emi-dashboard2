export interface AmortizationEntry {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
  extraPayment?: number;
}

export type PrepaymentStrategy = "reduce-tenure" | "reduce-emi";

export interface LumpSumPayment {
  month: number;
  amount: number;
  /** How to handle the loan after this prepayment */
  strategy: PrepaymentStrategy;
  /** For reduce-tenure only: explicit target remaining months (auto-calculated when omitted) */
  customRemainingTenure?: number;
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
 * Generate amortization schedule with per-entry prepayment strategies.
 *
 * Strategy "reduce-emi":     Keep remaining tenure fixed, recalculate (lower) EMI after prepayment.
 * Strategy "reduce-tenure":  Keep current EMI, compute shorter tenure using:
 *                            n = ⌈ log(EMI / (EMI − P·r)) / log(1 + r) ⌉
 *                            If customRemainingTenure is set, recalculate EMI for that target.
 *
 * Monthly-reducing-balance method (banking standard):
 *   Interest  = Outstanding Balance × Monthly Rate
 *   Principal = EMI − Interest
 *   Balance   = Balance − Principal − LumpSum
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
  let currentEMI = calculateEMI(principal, annualRate, months);

  // Effective end month — shortened by reduce-tenure prepayments
  let effectiveEndMonth = months;

  // Build map: month → ordered list of lump-sum entries
  const lumpSumMap = new Map<number, LumpSumPayment[]>();
  for (const ls of [...lumpSums].sort((a, b) => a.month - b.month)) {
    const existing = lumpSumMap.get(ls.month) ?? [];
    lumpSumMap.set(ls.month, [...existing, ls]);
  }

  for (let month = 1; month <= effectiveEndMonth; month++) {
    if (balance < 0.005) break; // rounding tolerance

    // ── Step 1: Interest this month ──────────────────────────────────────
    const interest = balance * monthlyRate;

    // ── Step 2: Principal this month (cap at remaining balance) ──────────
    const principalCapacity = currentEMI - interest;
    let principalPaid: number;
    let emiPaid: number;
    let isFinalPayment = false;

    if (principalCapacity >= balance) {
      // Final payment: adjust EMI so balance hits exactly zero (bank standard)
      principalPaid = balance;
      emiPaid = principalPaid + interest;
      isFinalPayment = true;
    } else {
      principalPaid = principalCapacity;
      emiPaid = currentEMI;
    }

    balance = Math.max(0, balance - principalPaid);

    // ── Step 3: Apply lump sums for this month ───────────────────────────
    let totalExtra = 0;

    if (!isFinalPayment) {
      const lumpSumsThisMonth = lumpSumMap.get(month) ?? [];

      for (const ls of lumpSumsThisMonth) {
        if (balance < 0.005) break;

        const actualExtra = Math.min(ls.amount, balance);
        totalExtra += actualExtra;
        balance = Math.max(0, balance - actualExtra);

        if (balance < 0.005) break; // loan cleared by this prepayment

        const remainingMonths = effectiveEndMonth - month;
        if (remainingMonths < 1) break;

        if (ls.strategy === "reduce-emi") {
          // Keep tenure, lower EMI
          currentEMI = calculateEMI(balance, annualRate, remainingMonths);

        } else {
          // reduce-tenure: keep EMI same (or use custom target months)
          if (ls.customRemainingTenure && ls.customRemainingTenure > 0) {
            // User-specified target: recalculate EMI for that horizon
            currentEMI = calculateEMI(balance, annualRate, ls.customRemainingTenure);
            effectiveEndMonth = month + ls.customRemainingTenure;
          } else {
            // Auto: derive new tenure with standard formula
            const minPayment = balance * monthlyRate;
            if (currentEMI <= minPayment) {
              // EMI too low to amortise — recalculate to avoid infinite loop
              currentEMI = calculateEMI(balance, annualRate, remainingMonths);
            } else {
              const newRemainingMonths = Math.ceil(
                Math.log(currentEMI / (currentEMI - minPayment)) /
                Math.log(1 + monthlyRate)
              );
              effectiveEndMonth = month + Math.max(1, newRemainingMonths);
            }
          }
        }
      }
    }

    schedule.push({
      month,
      emi: Math.round(emiPaid * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      extraPayment: Math.round(totalExtra * 100) / 100,
    });

    if (balance < 0.005) break;
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
