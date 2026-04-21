"use client";

import { Banknote, TrendingUp, Wallet, Receipt, Calculator, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import type { EMIResult } from "@/lib/emi-calculator";

interface ResultCardsProps {
  result: EMIResult | null;
  isLoading?: boolean;
}

const resultItems = [
  {
    key: "emi" as const,
    label: "Monthly EMI",
    icon: Banknote,
    tooltip: "Equated Monthly Installment - the fixed amount you pay each month",
    color: "text-primary",
    bgColor: "bg-primary/10",
    glowColor: "group-hover:shadow-primary/20",
  },
  {
    key: "totalInterest" as const,
    label: "Total Interest Payable",
    icon: TrendingUp,
    tooltip: "Total interest amount over the entire loan tenure",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    glowColor: "group-hover:shadow-chart-2/20",
  },
  {
    key: "totalAmount" as const,
    label: "Total Amount Payable",
    icon: Wallet,
    tooltip: "Principal + Total Interest",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    glowColor: "group-hover:shadow-chart-3/20",
  },
  {
    key: "processingFeeCost" as const,
    label: "Processing Fee Cost",
    icon: Receipt,
    tooltip: "One-time fee charged by the lender for processing your loan",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    glowColor: "group-hover:shadow-chart-4/20",
  },
  {
    key: "totalLoanCost" as const,
    label: "Total Loan Cost",
    icon: Calculator,
    tooltip: "Total Amount + Processing Fee + Tax/Insurance",
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    glowColor: "group-hover:shadow-chart-5/20",
  },
];

function AnimatedValue({ value, color }: { value: number; color: string }) {
  const animatedValue = useAnimatedCounter(value, 800);
  
  const formattedValue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(animatedValue));

  return (
    <motion.p
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`text-xl font-bold ${color} mt-1 tabular-nums`}
    >
      {formattedValue}
    </motion.p>
  );
}

export function ResultCards({ result, isLoading }: ResultCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {resultItems.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${item.glowColor} hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <motion.div 
                  className={`rounded-lg p-2 ${item.bgColor} transition-transform duration-300 group-hover:scale-110`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </motion.div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help transition-colors hover:text-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : result ? (
                  <AnimatedValue value={result[item.key]} color={item.color} />
                ) : (
                  <p className={`text-xl font-bold ${item.color} mt-1`}>---</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
