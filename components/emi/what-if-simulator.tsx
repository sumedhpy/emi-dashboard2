"use client";

import { useState, useEffect } from "react";
import { Sliders, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { calculateEMI, generateAmortizationSchedule, formatCurrency } from "@/lib/emi-calculator";

interface WhatIfSimulatorProps {
  basePrincipal: number;
  baseRate: number;
  baseTenure: number;
}

export function WhatIfSimulator({ basePrincipal, baseRate, baseTenure }: WhatIfSimulatorProps) {
  const [interestRate, setInterestRate] = useState(baseRate);
  const [tenure, setTenure] = useState(baseTenure);
  const [extraPayment, setExtraPayment] = useState(0);

  useEffect(() => {
    setInterestRate(baseRate);
    setTenure(baseTenure);
  }, [baseRate, baseTenure]);

  const baseEMI = calculateEMI(basePrincipal, baseRate, baseTenure);
  const currentEMI = calculateEMI(basePrincipal, interestRate, tenure);
  const effectiveEMI = currentEMI + extraPayment;

  const emiDiff = currentEMI - baseEMI;
  const percentChange = baseEMI > 0 ? ((currentEMI - baseEMI) / baseEMI) * 100 : 0;

  // Generate comparison data for chart
  const baseSchedule = generateAmortizationSchedule(basePrincipal, baseRate, baseTenure);
  const currentSchedule = generateAmortizationSchedule(basePrincipal, interestRate, tenure);

  const chartData = [];
  const maxMonths = Math.max(baseTenure, tenure);
  for (let i = 0; i <= maxMonths; i += 6) {
    const month = i === 0 ? 1 : i;
    const baseEntry = baseSchedule[Math.min(month - 1, baseSchedule.length - 1)];
    const currentEntry = currentSchedule[Math.min(month - 1, currentSchedule.length - 1)];
    
    chartData.push({
      month,
      base: month <= baseTenure ? (baseEntry?.balance || 0) : 0,
      current: month <= tenure ? (currentEntry?.balance || 0) : 0,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sliders className="h-5 w-5 text-primary" />
          What-if Simulator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Interest Rate</Label>
                <span className="text-sm font-medium text-primary">{interestRate.toFixed(1)}%</span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={([value]) => setInterestRate(value)}
                min={5}
                max={20}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">Base: {baseRate}%</p>
            </div>

            {/* Tenure */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Loan Tenure</Label>
                <span className="text-sm font-medium text-primary">{tenure} months ({Math.round(tenure / 12)} years)</span>
              </div>
              <Slider
                value={[tenure]}
                onValueChange={([value]) => setTenure(value)}
                min={12}
                max={360}
                step={12}
              />
              <p className="text-xs text-muted-foreground">Base: {baseTenure} months</p>
            </div>

            {/* Extra Monthly Payment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Extra Monthly Payment</Label>
                <span className="text-sm font-medium text-primary">{formatCurrency(extraPayment)}</span>
              </div>
              <Slider
                value={[extraPayment]}
                onValueChange={([value]) => setExtraPayment(value)}
                min={0}
                max={50000}
                step={1000}
              />
            </div>

            {/* Results Summary */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Base EMI</span>
                <span className="font-medium">{formatCurrency(baseEMI)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New EMI</span>
                <span className="font-semibold text-primary">{formatCurrency(currentEMI)}</span>
              </div>
              {extraPayment > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Effective Payment</span>
                  <span className="font-semibold">{formatCurrency(effectiveEMI)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Difference</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  emiDiff > 0 ? "text-destructive" : emiDiff < 0 ? "text-primary" : ""
                }`}>
                  {emiDiff > 0 ? <TrendingUp className="h-4 w-4" /> : emiDiff < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {formatCurrency(Math.abs(emiDiff))} ({percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  label={{ value: "Month", position: "bottom", offset: -5, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Month ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="base"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Base Scenario"
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="hsl(160, 60%, 45%)"
                  strokeWidth={2}
                  dot={false}
                  name="Current Scenario"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
