"use client";

import { useState } from "react";
import { Scale, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateEMI, calculateTotalInterest, formatCurrency } from "@/lib/emi-calculator";

interface LoanData {
  amount: number;
  rate: number;
  tenure: number;
}

interface ComparisonResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  tenure: number;
}

export function LoanComparison() {
  const [loanA, setLoanA] = useState<LoanData>({ amount: 1000000, rate: 8.5, tenure: 20 });
  const [loanB, setLoanB] = useState<LoanData>({ amount: 1000000, rate: 9.0, tenure: 15 });
  const [results, setResults] = useState<{ a: ComparisonResult; b: ComparisonResult } | null>(null);

  const compare = () => {
    const tenureA = loanA.tenure * 12;
    const tenureB = loanB.tenure * 12;

    const emiA = calculateEMI(loanA.amount, loanA.rate, tenureA);
    const emiB = calculateEMI(loanB.amount, loanB.rate, tenureB);

    const interestA = calculateTotalInterest(loanA.amount, loanA.rate, tenureA);
    const interestB = calculateTotalInterest(loanB.amount, loanB.rate, tenureB);

    setResults({
      a: {
        emi: emiA,
        totalInterest: interestA,
        totalPayment: loanA.amount + interestA,
        tenure: tenureA,
      },
      b: {
        emi: emiB,
        totalInterest: interestB,
        totalPayment: loanB.amount + interestB,
        tenure: tenureB,
      },
    });
  };

  const getBetter = (key: keyof ComparisonResult, lowerIsBetter: boolean = true): "a" | "b" | null => {
    if (!results) return null;
    if (results.a[key] === results.b[key]) return null;
    if (lowerIsBetter) {
      return results.a[key] < results.b[key] ? "a" : "b";
    }
    return results.a[key] > results.b[key] ? "a" : "b";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5 text-primary" />
          Loan Comparison Tool
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Loan A */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">A</span>
              Loan A
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="loanA-amount">Loan Amount</Label>
                <Input
                  id="loanA-amount"
                  type="number"
                  value={loanA.amount}
                  onChange={(e) => setLoanA({ ...loanA, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="loanA-rate">Interest Rate (%)</Label>
                <Input
                  id="loanA-rate"
                  type="number"
                  step="0.1"
                  value={loanA.rate}
                  onChange={(e) => setLoanA({ ...loanA, rate: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="loanA-tenure">Tenure (Years)</Label>
                <Input
                  id="loanA-tenure"
                  type="number"
                  value={loanA.tenure}
                  onChange={(e) => setLoanA({ ...loanA, tenure: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Loan B */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-chart-2 text-foreground flex items-center justify-center text-xs">B</span>
              Loan B
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="loanB-amount">Loan Amount</Label>
                <Input
                  id="loanB-amount"
                  type="number"
                  value={loanB.amount}
                  onChange={(e) => setLoanB({ ...loanB, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="loanB-rate">Interest Rate (%)</Label>
                <Input
                  id="loanB-rate"
                  type="number"
                  step="0.1"
                  value={loanB.rate}
                  onChange={(e) => setLoanB({ ...loanB, rate: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="loanB-tenure">Tenure (Years)</Label>
                <Input
                  id="loanB-tenure"
                  type="number"
                  value={loanB.tenure}
                  onChange={(e) => setLoanB({ ...loanB, tenure: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={compare} className="w-full mb-6">
          <ArrowRight className="h-4 w-4 mr-2" />
          Compare Loans
        </Button>

        {results && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-center">Loan A</TableHead>
                <TableHead className="text-center">Loan B</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Monthly EMI</TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("emi") === "a" ? "text-primary font-semibold" : ""}>
                    {formatCurrency(results.a.emi)}
                  </span>
                  {getBetter("emi") === "a" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Better
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("emi") === "b" ? "text-primary font-semibold" : ""}>
                    {formatCurrency(results.b.emi)}
                  </span>
                  {getBetter("emi") === "b" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Better
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Interest</TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("totalInterest") === "a" ? "text-primary font-semibold" : ""}>
                    {formatCurrency(results.a.totalInterest)}
                  </span>
                  {getBetter("totalInterest") === "a" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Better
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("totalInterest") === "b" ? "text-primary font-semibold" : ""}>
                    {formatCurrency(results.b.totalInterest)}
                  </span>
                  {getBetter("totalInterest") === "b" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Better
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Payment</TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("totalPayment") === "a" ? "text-primary font-semibold" : ""}>
                    {formatCurrency(results.a.totalPayment)}
                  </span>
                  {getBetter("totalPayment") === "a" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Better
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("totalPayment") === "b" ? "text-primary font-semibold" : ""}>
                    {formatCurrency(results.b.totalPayment)}
                  </span>
                  {getBetter("totalPayment") === "b" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Better
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Loan Duration</TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("tenure") === "a" ? "text-primary font-semibold" : ""}>
                    {results.a.tenure} months ({Math.round(results.a.tenure / 12)} years)
                  </span>
                  {getBetter("tenure") === "a" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Shorter
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={getBetter("tenure") === "b" ? "text-primary font-semibold" : ""}>
                    {results.b.tenure} months ({Math.round(results.b.tenure / 12)} years)
                  </span>
                  {getBetter("tenure") === "b" && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" /> Shorter
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
