"use client";

import { useState } from "react";
import { Info, RotateCcw, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LoanDetails } from "@/lib/emi-calculator";
import { numberToWords } from "@/lib/number-to-words";

interface LoanInputFormProps {
  onCalculate: (details: LoanDetails) => void;
  isLoading?: boolean;
}

export function LoanInputForm({ onCalculate, isLoading }: LoanInputFormProps) {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [tenureType, setTenureType] = useState<"years" | "months">("years");
  const [processingFee, setProcessingFee] = useState(1);
  const [taxInsurance, setTaxInsurance] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (loanAmount <= 0 || loanAmount > 100000000) {
      newErrors.loanAmount = "Loan amount must be between 1 and 10 crore";
    }
    if (interestRate <= 0 || interestRate > 30) {
      newErrors.interestRate = "Interest rate must be between 0.1% and 30%";
    }
    if (tenure <= 0 || (tenureType === "years" && tenure > 30) || (tenureType === "months" && tenure > 360)) {
      newErrors.tenure = tenureType === "years" 
        ? "Tenure must be between 1 and 30 years" 
        : "Tenure must be between 1 and 360 months";
    }
    if (processingFee < 0 || processingFee > 10) {
      newErrors.processingFee = "Processing fee must be between 0% and 10%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (!validate()) return;

    const tenureMonths = tenureType === "years" ? tenure * 12 : tenure;
    onCalculate({
      loanAmount,
      interestRate,
      tenureMonths,
      processingFee,
      taxInsurance,
    });
  };

  const handleReset = () => {
    setLoanAmount(1000000);
    setInterestRate(8.5);
    setTenure(20);
    setTenureType("years");
    setProcessingFee(1);
    setTaxInsurance(0);
    setErrors({});
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Loan Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loan Amount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="loanAmount" className="flex items-center gap-1.5">
              Loan Amount
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The total principal amount you wish to borrow</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <span className="text-sm font-medium text-primary">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(loanAmount)}
            </span>
          </div>
          <Input
            id="loanAmount"
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className={errors.loanAmount ? "border-destructive" : ""}
          />
          <Slider
            value={[loanAmount]}
            onValueChange={([value]) => setLoanAmount(value)}
            min={100000}
            max={10000000}
            step={50000}
            className="py-2"
          />
          {errors.loanAmount && (
            <p className="text-xs text-destructive">{errors.loanAmount}</p>
          )}
          <p className="text-xs text-muted-foreground italic">
            {numberToWords(loanAmount)}
          </p>
        </div>

        {/* Interest Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="interestRate" className="flex items-center gap-1.5">
              Interest Rate (% per year)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Annual interest rate charged by the lender</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <span className="text-sm font-medium text-primary">{interestRate}%</span>
          </div>
          <Input
            id="interestRate"
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className={errors.interestRate ? "border-destructive" : ""}
          />
          <Slider
            value={[interestRate]}
            onValueChange={([value]) => setInterestRate(value)}
            min={1}
            max={20}
            step={0.1}
            className="py-2"
          />
          {errors.interestRate && (
            <p className="text-xs text-destructive">{errors.interestRate}</p>
          )}
        </div>

        {/* Loan Tenure */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="tenure" className="flex items-center gap-1.5">
              Loan Tenure
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duration over which the loan will be repaid</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <span className="text-sm font-medium text-primary">
              {tenure} {tenureType}
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              id="tenure"
              type="number"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className={`flex-1 ${errors.tenure ? "border-destructive" : ""}`}
            />
            <Select value={tenureType} onValueChange={(value: "years" | "months") => setTenureType(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="years">Years</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Slider
            value={[tenure]}
            onValueChange={([value]) => setTenure(value)}
            min={1}
            max={tenureType === "years" ? 30 : 360}
            step={1}
            className="py-2"
          />
          {errors.tenure && (
            <p className="text-xs text-destructive">{errors.tenure}</p>
          )}
        </div>

        {/* Processing Fee */}
        <div className="space-y-3">
          <Label htmlFor="processingFee" className="flex items-center gap-1.5">
            Processing Fee (%)
            <span className="text-xs text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="processingFee"
            type="number"
            step="0.1"
            value={processingFee}
            onChange={(e) => setProcessingFee(Number(e.target.value))}
            className={errors.processingFee ? "border-destructive" : ""}
          />
          {errors.processingFee && (
            <p className="text-xs text-destructive">{errors.processingFee}</p>
          )}
        </div>

        {/* Tax / Insurance */}
        <div className="space-y-3">
          <Label htmlFor="taxInsurance" className="flex items-center gap-1.5">
            Tax / Insurance
            <span className="text-xs text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="taxInsurance"
            type="number"
            value={taxInsurance}
            onChange={(e) => setTaxInsurance(Number(e.target.value))}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleCalculate} className="flex-1" disabled={isLoading}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate EMI
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
