"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Percent, DoorOpen, Plus, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  calculateStepEMI,
  calculateVariableRateEMI,
  calculateForeclosure,
  formatCurrency,
  type RateChange,
} from "@/lib/emi-calculator";

interface AdvancedEMIFeaturesProps {
  principal: number;
  interestRate: number;
  tenureMonths: number;
  currentEMI: number;
}

export function AdvancedEMIFeatures({
  principal,
  interestRate,
  tenureMonths,
  currentEMI,
}: AdvancedEMIFeaturesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced EMI Features</CardTitle>
        <CardDescription>
          Explore step-up/step-down EMI, variable rates, and foreclosure options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="step-emi" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="step-emi" className="gap-1 text-xs sm:text-sm">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Step EMI</span>
              <span className="sm:hidden">Step</span>
            </TabsTrigger>
            <TabsTrigger value="variable-rate" className="gap-1 text-xs sm:text-sm">
              <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Variable Rate</span>
              <span className="sm:hidden">Variable</span>
            </TabsTrigger>
            <TabsTrigger value="foreclosure" className="gap-1 text-xs sm:text-sm">
              <DoorOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Foreclosure</span>
              <span className="sm:hidden">Close</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="step-emi" className="mt-4">
            <StepEMICalculator
              principal={principal}
              interestRate={interestRate}
              tenureMonths={tenureMonths}
              currentEMI={currentEMI}
            />
          </TabsContent>

          <TabsContent value="variable-rate" className="mt-4">
            <VariableRateCalculator
              principal={principal}
              interestRate={interestRate}
              tenureMonths={tenureMonths}
            />
          </TabsContent>

          <TabsContent value="foreclosure" className="mt-4">
            <ForeclosureCalculator
              principal={principal}
              interestRate={interestRate}
              tenureMonths={tenureMonths}
              currentEMI={currentEMI}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Step-Up / Step-Down EMI Component
function StepEMICalculator({
  principal,
  interestRate,
  tenureMonths,
  currentEMI,
}: {
  principal: number;
  interestRate: number;
  tenureMonths: number;
  currentEMI: number;
}) {
  const [stepType, setStepType] = useState<"up" | "down">("up");
  const [stepPercentage, setStepPercentage] = useState(5);
  const [stepInterval, setStepInterval] = useState(1);
  const [result, setResult] = useState<ReturnType<typeof calculateStepEMI> | null>(null);

  const calculate = () => {
    const stepValue = stepType === "up" ? stepPercentage : -stepPercentage;
    const calculated = calculateStepEMI({
      principal,
      annualRate: interestRate,
      tenureMonths,
      stepPercentage: stepValue,
      stepIntervalYears: stepInterval,
    });
    setResult(calculated);
  };

  const regularTotalInterest = currentEMI * tenureMonths - principal;
  const interestDiff = result ? result.totalInterest - regularTotalInterest : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>EMI Type</Label>
          <Select value={stepType} onValueChange={(v) => setStepType(v as "up" | "down")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="up">
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  Step-Up EMI
                </span>
              </SelectItem>
              <SelectItem value="down">
                <span className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                  Step-Down EMI
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Step Percentage: {stepPercentage}%</Label>
          <Slider
            value={[stepPercentage]}
            onValueChange={([v]) => setStepPercentage(v)}
            min={1}
            max={20}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Interval (Years)</Label>
          <Select value={stepInterval.toString()} onValueChange={(v) => setStepInterval(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  Every {y} year{y > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={calculate} className="w-full">
        Calculate Step EMI
      </Button>

      {result && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Starting EMI</p>
              <p className="text-lg font-semibold">{formatCurrency(result.emiByYear[0]?.emi || 0)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Final EMI</p>
              <p className="text-lg font-semibold">
                {formatCurrency(result.emiByYear[result.emiByYear.length - 1]?.emi || 0)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="text-lg font-semibold">{formatCurrency(result.totalInterest)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">vs Regular EMI</p>
              <p className={`text-lg font-semibold ${interestDiff > 0 ? "text-destructive" : "text-primary"}`}>
                {interestDiff > 0 ? "+" : ""}{formatCurrency(interestDiff)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">EMI Schedule by Year</h4>
            <div className="flex flex-wrap gap-2">
              {result.emiByYear.map((item) => (
                <Badge key={item.year} variant="outline" className="text-xs">
                  Year {item.year}: {formatCurrency(item.emi)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Variable Interest Rate Component
function VariableRateCalculator({
  principal,
  interestRate,
  tenureMonths,
}: {
  principal: number;
  interestRate: number;
  tenureMonths: number;
}) {
  const [rateChanges, setRateChanges] = useState<RateChange[]>([
    { fromMonth: 24, newRate: interestRate + 0.5 },
  ]);
  const [result, setResult] = useState<ReturnType<typeof calculateVariableRateEMI> | null>(null);

  const addRateChange = () => {
    const lastMonth = rateChanges.length > 0 ? rateChanges[rateChanges.length - 1].fromMonth : 0;
    setRateChanges([
      ...rateChanges,
      { fromMonth: Math.min(lastMonth + 12, tenureMonths), newRate: interestRate },
    ]);
  };

  const removeRateChange = (index: number) => {
    setRateChanges(rateChanges.filter((_, i) => i !== index));
  };

  const updateRateChange = (index: number, field: keyof RateChange, value: number) => {
    setRateChanges(
      rateChanges.map((rc, i) => (i === index ? { ...rc, [field]: value } : rc))
    );
  };

  const calculate = () => {
    const calculated = calculateVariableRateEMI(principal, interestRate, tenureMonths, rateChanges);
    setResult(calculated);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Initial Interest Rate</p>
          <p className="text-lg font-semibold">{interestRate}% p.a.</p>
        </div>
        <Badge>Month 1 onwards</Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Rate Changes</Label>
          <Button variant="outline" size="sm" onClick={addRateChange} className="gap-1">
            <Plus className="h-3 w-3" />
            Add Change
          </Button>
        </div>

        {rateChanges.map((rc, index) => (
          <div key={index} className="flex items-end gap-2 p-3 bg-secondary/50 rounded-lg">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">From Month</Label>
              <Input
                type="number"
                value={rc.fromMonth}
                onChange={(e) => updateRateChange(index, "fromMonth", Number(e.target.value))}
                min={1}
                max={tenureMonths}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">New Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={rc.newRate}
                onChange={(e) => updateRateChange(index, "newRate", Number(e.target.value))}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRateChange(index)}
              className="h-9 w-9 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button onClick={calculate} className="w-full">
        Calculate Variable Rate EMI
      </Button>

      {result && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="text-lg font-semibold">{formatCurrency(result.totalInterest)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(result.totalAmount)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">EMI Changes</h4>
            <div className="space-y-2">
              {result.emiChanges.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg text-sm"
                >
                  <span className="text-muted-foreground">
                    Month {item.month} @ {item.rate}%
                  </span>
                  <span className="font-medium">{formatCurrency(item.emi)}/month</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Foreclosure Calculator Component
function ForeclosureCalculator({
  principal,
  interestRate,
  tenureMonths,
  currentEMI,
}: {
  principal: number;
  interestRate: number;
  tenureMonths: number;
  currentEMI: number;
}) {
  const [foreclosureMonth, setForeclosureMonth] = useState(Math.floor(tenureMonths / 2));
  const [foreclosureCharge, setForeclosureCharge] = useState(2);
  const [result, setResult] = useState<ReturnType<typeof calculateForeclosure> | null>(null);

  const calculate = () => {
    const calculated = calculateForeclosure(
      principal,
      interestRate,
      tenureMonths,
      foreclosureMonth,
      foreclosureCharge
    );
    setResult(calculated);
  };

  const yearsMonths = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} months`;
    if (remainingMonths === 0) return `${years} year${years > 1 ? "s" : ""}`;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Foreclosure After Month: {foreclosureMonth} ({yearsMonths(foreclosureMonth)})</Label>
          <Slider
            value={[foreclosureMonth]}
            onValueChange={([v]) => setForeclosureMonth(v)}
            min={1}
            max={tenureMonths - 1}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Foreclosure Charges: {foreclosureCharge}%</Label>
          <Slider
            value={[foreclosureCharge]}
            onValueChange={([v]) => setForeclosureCharge(v)}
            min={0}
            max={5}
            step={0.5}
          />
        </div>
      </div>

      <Button onClick={calculate} className="w-full">
        Calculate Foreclosure
      </Button>

      {result && (
        <div className="space-y-4 pt-4 border-t">
          {/* Loan Closure Summary */}
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DoorOpen className="h-4 w-4" />
              Loan Closure Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Closure Month</p>
                <p className="font-medium">{result.foreclosureMonth} ({yearsMonths(result.foreclosureMonth)})</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining Principal</p>
                <p className="font-medium">{formatCurrency(result.remainingPrincipal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Foreclosure Amount</p>
                <p className="font-medium text-primary">{formatCurrency(result.foreclosureAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Paid (with foreclosure)</p>
                <p className="font-medium">{formatCurrency(result.totalPaidTillForeclosure)}</p>
              </div>
            </div>
          </div>

          {/* Savings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">Interest Saved</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(result.interestSaved)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">Time Saved</p>
              <p className="text-xl font-bold text-primary">{yearsMonths(result.monthsSaved)}</p>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Payment Breakdown Till Foreclosure</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">EMIs Paid</p>
                <p className="font-semibold">{result.foreclosureMonth}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Principal Paid</p>
                <p className="font-semibold text-sm">{formatCurrency(result.paidPrincipal)}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Interest Paid</p>
                <p className="font-semibold text-sm">{formatCurrency(result.paidInterest)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
