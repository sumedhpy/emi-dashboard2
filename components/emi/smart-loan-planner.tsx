"use client";

import { useState } from "react";
import { BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/emi-calculator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  label: string;
  emi: number;
  tenureMonths: number;
  totalPayment: number;
  totalInterest: number;
  color: {
    border: string;
    title: string;
    value: string;
    badge: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Exact formula: n = ln(EMI / (EMI - P*r)) / ln(1 + r) */
function calcTenure(emi: number, principal: number, monthlyRate: number): number | null {
  const denominator = emi - principal * monthlyRate;
  if (denominator <= 0) return null; // EMI must exceed P*r
  const n = Math.log(emi / denominator) / Math.log(1 + monthlyRate);
  return Math.ceil(n);
}

function buildPlans(principal: number, annualRate: number, cappedEMI: number): Plan[] | string {
  const r = annualRate / 12 / 100;

  const configs = [
    {
      label: "Conservative",
      factor: 0.5,
      color: {
        border: "border-green-500/40",
        title: "text-green-400",
        value: "text-green-300",
        badge: "bg-green-500/10 text-green-400 border border-green-500/30",
      },
    },
    {
      label: "Balanced",
      factor: 0.75,
      color: {
        border: "border-cyan-500/40",
        title: "text-cyan-400",
        value: "text-cyan-300",
        badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
      },
    },
    {
      label: "Aggressive",
      factor: 1.0,
      color: {
        border: "border-orange-500/40",
        title: "text-orange-400",
        value: "text-orange-300",
        badge: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
      },
    },
  ];

  const plans: Plan[] = [];

  for (const cfg of configs) {
    const emi = Math.round(cappedEMI * cfg.factor * 100) / 100;

    if (emi <= principal * r) {
      return `EMI for the ${cfg.label} plan (${formatCurrency(emi)}) is too low — it must exceed the monthly interest (${formatCurrency(principal * r)}). Please increase your Max EMI or reduce the loan amount.`;
    }

    const n = calcTenure(emi, principal, r);
    if (!n || n <= 0) {
      return `Could not compute tenure for ${cfg.label} plan. Check your inputs.`;
    }

    const totalPayment = Math.round(emi * n * 100) / 100;
    const totalInterest = Math.round((totalPayment - principal) * 100) / 100;

    plans.push({
      label: cfg.label,
      emi,
      tenureMonths: n,
      totalPayment,
      totalInterest,
      color: cfg.color,
    });
  }

  return plans;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartLoanPlanner() {
  const [loanAmount, setLoanAmount]   = useState("");
  const [salary, setSalary]           = useState("");
  const [maxEMI, setMaxEMI]           = useState("");
  const [interestRate, setInterestRate] = useState("");

  const [plans, setPlans]   = useState<Plan[] | null>(null);
  const [error, setError]   = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    setPlans(null);

    const P   = parseFloat(loanAmount);
    const sal = parseFloat(salary);
    const emi = parseFloat(maxEMI);
    const r   = parseFloat(interestRate);

    if (!P || !sal || !emi || !r || P <= 0 || sal <= 0 || emi <= 0 || r <= 0) {
      setError("Please fill in all fields with valid positive values.");
      return;
    }

    // Cap EMI to 50% of salary
    const cappedEMI = Math.min(emi, sal * 0.5);

    const result = buildPlans(P, r, cappedEMI);

    if (typeof result === "string") {
      setError(result);
    } else {
      setPlans(result);
    }
  };

  const salaryHalf = parseFloat(salary) > 0 ? parseFloat(salary) * 0.5 : null;
  const isCapped   = salaryHalf !== null && parseFloat(maxEMI) > salaryHalf;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Smart Loan Planner
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Find the best EMI plan based on your salary and loan details.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Inputs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="slp-loan">Loan Amount (₹)</Label>
            <Input
              id="slp-loan"
              type="number"
              min={1}
              placeholder="e.g. 1000000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slp-salary">Monthly Salary (₹)</Label>
            <Input
              id="slp-salary"
              type="number"
              min={1}
              placeholder="e.g. 80000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slp-emi">
              Max EMI You Can Afford (₹)
              {isCapped && (
                <span className="ml-2 text-xs text-amber-400">
                  → capped to {formatCurrency(salaryHalf!)} (50% of salary)
                </span>
              )}
            </Label>
            <Input
              id="slp-emi"
              type="number"
              min={1}
              placeholder="e.g. 35000"
              value={maxEMI}
              onChange={(e) => setMaxEMI(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slp-rate">Interest Rate (% per annum)</Label>
            <Input
              id="slp-rate"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="e.g. 8.5"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleGenerate}>
          Generate Plans
        </Button>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Plan Cards ── */}
        {plans && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {plans.map((plan) => (
              <div
                key={plan.label}
                className={`rounded-xl border-2 ${plan.color.border} bg-card p-4 space-y-3 shadow-sm`}
              >
                {/* Title */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${plan.color.title}`}>
                    {plan.label}
                  </span>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${plan.color.badge}`}>
                    {plan.tenureMonths} mo
                  </span>
                </div>

                {/* EMI highlight */}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Monthly EMI</p>
                  <p className={`text-xl font-bold ${plan.color.value}`}>
                    {formatCurrency(plan.emi)}
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tenure</span>
                    <span className="font-medium">{plan.tenureMonths} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Interest</span>
                    <span className="font-medium">{formatCurrency(plan.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Payment</span>
                    <span className="font-medium">{formatCurrency(plan.totalPayment)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
