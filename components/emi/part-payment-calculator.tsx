"use client";

import { useState } from "react";
import { Banknote, Clock, TrendingDown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { applyPartPayment, formatCurrency } from "@/lib/emi-calculator";
import type { PartPaymentResult } from "@/lib/emi-calculator";

interface PartPaymentCalculatorProps {
  principal: number;
  interestRate: number;
  tenure: number;
  currentEMI: number;
}

export function PartPaymentCalculator({
  principal,
  interestRate,
  tenure,
  currentEMI,
}: PartPaymentCalculatorProps) {
  const [partPayment, setPartPayment] = useState(100000);
  const [reduceType, setReduceType] = useState<"emi" | "tenure">("tenure");
  const [result, setResult] = useState<PartPaymentResult | null>(null);

  const calculate = () => {
    if (partPayment <= 0 || partPayment >= principal) return;
    
    const calcResult = applyPartPayment(
      principal,
      interestRate,
      tenure,
      partPayment,
      reduceType,
      0
    );
    setResult(calcResult);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Banknote className="h-5 w-5 text-primary" />
          Part-Payment Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="partPayment">Lump-sum Payment Amount</Label>
              <Input
                id="partPayment"
                type="number"
                value={partPayment}
                onChange={(e) => setPartPayment(Number(e.target.value))}
                placeholder="Enter amount"
              />
              <p className="text-xs text-muted-foreground">
                Current outstanding: {formatCurrency(principal)}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Choose Option</Label>
              <RadioGroup
                value={reduceType}
                onValueChange={(value: "emi" | "tenure") => setReduceType(value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="emi"
                    id="reduce-emi"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="reduce-emi"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <TrendingDown className="mb-2 h-5 w-5" />
                    <span className="text-sm font-medium">Reduce EMI</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Keep same tenure, lower monthly payment
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="tenure"
                    id="reduce-tenure"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="reduce-tenure"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Clock className="mb-2 h-5 w-5" />
                    <span className="text-sm font-medium">Reduce Tenure</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Keep same EMI, pay off faster
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={calculate} className="w-full" disabled={partPayment <= 0 || partPayment >= principal}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Calculate Savings
            </Button>

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 text-center">
                    <p className="text-xs text-muted-foreground mb-1">New EMI</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(result.newEMI)}
                    </p>
                    {reduceType === "emi" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Save {formatCurrency(currentEMI - result.newEMI)}/month
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-chart-2/10 text-center">
                    <p className="text-xs text-muted-foreground mb-1">New Tenure</p>
                    <p className="text-lg font-bold text-chart-2">
                      {result.newTenure} months
                    </p>
                    {reduceType === "tenure" && result.timeSaved > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.timeSaved} months saved
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">Total Interest Saved</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(result.interestSaved)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Updated Schedule Preview */}
          <div>
            {result && result.newSchedule.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Updated Schedule Preview</h4>
                <ScrollArea className="h-[350px] rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                      <TableRow>
                        <TableHead className="w-16">Month</TableHead>
                        <TableHead className="text-right">EMI</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.newSchedule.slice(0, 60).map((entry) => (
                        <TableRow key={entry.month}>
                          <TableCell className="font-medium">{entry.month}</TableCell>
                          <TableCell className="text-right">{formatCurrency(entry.emi)}</TableCell>
                          <TableCell className="text-right text-primary">{formatCurrency(entry.principal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(entry.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {result.newSchedule.length > 60 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Showing first 60 months of {result.newSchedule.length} total
                  </p>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 border rounded-lg bg-muted/30">
                <div>
                  <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Enter a part payment amount and calculate to see the updated schedule
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
