"use client";

import { useState, useCallback } from "react";
import { SmartLoanPlanner } from "@/components/emi/smart-loan-planner";
import { Header } from "@/components/emi/header";
import { LoanInputForm } from "@/components/emi/loan-input-form";
import { ResultCards } from "@/components/emi/result-cards";
import { EMICharts } from "@/components/emi/emi-charts";
import { AmortizationTable } from "@/components/emi/amortization-table";
import { LoanComparison } from "@/components/emi/loan-comparison";
import { PartPaymentCalculator } from "@/components/emi/part-payment-calculator";
import { AdvancedEMIFeatures } from "@/components/emi/advanced-emi-features";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Scale, Banknote, Settings2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calculateEMIResult,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithLumpSums,
  type LoanDetails,
  type EMIResult,
  type AmortizationEntry,
  type LumpSumPayment,
  type PrepaymentStrategy,
} from "@/lib/emi-calculator";

export default function EMICalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EMIResult | null>(null);
  const [schedule, setSchedule] = useState<AmortizationEntry[]>([]);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    loanAmount: 1000000,
    interestRate: 8.5,
    tenureMonths: 240,
  });
  const [lumpSums, setLumpSums] = useState<LumpSumPayment[]>([]);
  const [lumpMonth, setLumpMonth] = useState<string>("");
  const [lumpAmount, setLumpAmount] = useState<string>("");
  const [lumpStrategy, setLumpStrategy] = useState<PrepaymentStrategy>("reduce-emi");
  const [lumpCustomTenure, setLumpCustomTenure] = useState<string>("");

  const addLumpSum = useCallback(() => {
    const month = parseInt(lumpMonth);
    const amount = parseFloat(lumpAmount);
    if (!month || month < 1 || !amount || amount <= 0) return;
    const customRemainingTenure =
      lumpStrategy === "reduce-tenure" && lumpCustomTenure
        ? parseInt(lumpCustomTenure)
        : undefined;
    setLumpSums((prev) =>
      [...prev, { month, amount, strategy: lumpStrategy, customRemainingTenure }].sort(
        (a, b) => a.month - b.month
      )
    );
    setLumpMonth("");
    setLumpAmount("");
    setLumpCustomTenure("");
  }, [lumpMonth, lumpAmount, lumpStrategy, lumpCustomTenure]);

  const removeLumpSum = useCallback((index: number) => {
    setLumpSums((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCalculate = useCallback((details: LoanDetails) => {
    setIsLoading(true);
    setLoanDetails(details);

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      const emiResult = calculateEMIResult(details);
      const amortizationSchedule = lumpSums.length > 0
        ? generateAmortizationScheduleWithLumpSums(
          details.loanAmount,
          details.interestRate,
          details.tenureMonths,
          lumpSums
        )
        : generateAmortizationSchedule(
          details.loanAmount,
          details.interestRate,
          details.tenureMonths
        );

      setResult(emiResult);
      setSchedule(amortizationSchedule);
      setIsLoading(false);
    }, 300);
  }, [lumpSums]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Loan Inputs */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <LoanInputForm onCalculate={handleCalculate} isLoading={isLoading} />

            {/* Lump Sum Prepayment Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  Lump Sum Prepayments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Month + Amount inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lump-month" className="text-xs">Month</Label>
                    <Input
                      id="lump-month"
                      type="number"
                      min={1}
                      placeholder="e.g. 6"
                      value={lumpMonth}
                      onChange={(e) => setLumpMonth(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lump-amount" className="text-xs">Amount (₹)</Label>
                    <Input
                      id="lump-amount"
                      type="number"
                      min={1}
                      placeholder="e.g. 50000"
                      value={lumpAmount}
                      onChange={(e) => setLumpAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Strategy selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Prepayment Strategy</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLumpStrategy("reduce-emi")}
                      className={`text-xs px-2 py-2 rounded-md border transition-all text-left ${
                        lumpStrategy === "reduce-emi"
                          ? "border-primary bg-primary/15 text-primary font-medium"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="block font-semibold">Reduce EMI</span>
                      <span className="block text-[10px] opacity-70 mt-0.5">Keep Tenure Same</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLumpStrategy("reduce-tenure"); setLumpCustomTenure(""); }}
                      className={`text-xs px-2 py-2 rounded-md border transition-all text-left ${
                        lumpStrategy === "reduce-tenure"
                          ? "border-amber-500/70 bg-amber-500/10 text-amber-400 font-medium"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-amber-500/30"
                      }`}
                    >
                      <span className="block font-semibold">Reduce Tenure</span>
                      <span className="block text-[10px] opacity-70 mt-0.5">Keep EMI Same</span>
                    </button>
                  </div>
                </div>

                {/* Optional custom remaining tenure — only for reduce-tenure */}
                {lumpStrategy === "reduce-tenure" && (
                  <div className="space-y-1">
                    <Label htmlFor="lump-custom-tenure" className="text-xs">
                      Target Remaining Months
                      <span className="ml-1 text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="lump-custom-tenure"
                      type="number"
                      min={1}
                      placeholder="Auto-calculate if empty"
                      value={lumpCustomTenure}
                      onChange={(e) => setLumpCustomTenure(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={addLumpSum}
                  disabled={!lumpMonth || !lumpAmount}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Prepayment
                </Button>

                {lumpSums.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {lumpSums.map((ls, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                      >
                        <span className="flex items-center gap-1.5 flex-wrap">
                          Month <Badge variant="secondary">{ls.month}</Badge>
                          {" "}— ₹{ls.amount.toLocaleString("en-IN")}
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 ${
                              ls.strategy === "reduce-emi"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {ls.strategy === "reduce-emi"
                              ? "Reduce EMI"
                              : ls.customRemainingTenure
                              ? `Reduce Tenure (${ls.customRemainingTenure}mo)`
                              : "Reduce Tenure"}
                          </Badge>
                        </span>
                        <button
                          onClick={() => removeLumpSum(i)}
                          className="text-destructive hover:text-destructive/80 transition-colors ml-2 flex-shrink-0"
                          aria-label="Remove lump sum"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results Dashboard */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Result Cards */}
            <ResultCards result={result} isLoading={isLoading} />

            {/* Charts */}
            {result && (
              <EMICharts
                principal={loanDetails.loanAmount}
                totalInterest={result.totalInterest}
                schedule={schedule}
                isLoading={isLoading}
              />
            )}

            {/* Amortization Table */}
            <AmortizationTable schedule={schedule} isLoading={isLoading} />

            {/* Smart Loan Planner — full-width tool on the main page */}
            <SmartLoanPlanner
              syncedLoanAmount={result != null ? loanDetails.loanAmount : undefined}
              syncedInterestRate={result != null ? loanDetails.interestRate : undefined}
            />

            {/* Advanced Tools */}
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                <TabsTrigger value="comparison" className="gap-2">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Compare Loans</span>
                  <span className="sm:hidden">Compare</span>
                </TabsTrigger>
                <TabsTrigger value="partpayment" className="gap-2">
                  <Banknote className="h-4 w-4" />
                  <span className="hidden sm:inline">Part Payment</span>
                  <span className="sm:hidden">Part Pay</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Advanced</span>
                  <span className="sm:hidden">Adv</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="mt-4">
                <LoanComparison />
              </TabsContent>

              <TabsContent value="partpayment" className="mt-4">
                <PartPaymentCalculator
                  principal={loanDetails.loanAmount}
                  interestRate={loanDetails.interestRate}
                  tenure={loanDetails.tenureMonths}
                  currentEMI={result?.emi || 0}
                />
              </TabsContent>

              <TabsContent value="advanced" className="mt-4">
                <AdvancedEMIFeatures
                  principal={loanDetails.loanAmount}
                  interestRate={loanDetails.interestRate}
                  tenureMonths={loanDetails.tenureMonths}
                  currentEMI={result?.emi || 0}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t text-center text-sm text-muted-foreground">
          <p>
            Advanced EMI Calculator — Built with precision for your financial planning needs
          </p>
          <p className="mt-1">
            <Calculator className="inline h-3 w-3 mr-1" />
            EMI = P × r × (1+r)^n / ((1+r)^n - 1)
          </p>
        </footer>
      </main>
    </div>
  );
}
