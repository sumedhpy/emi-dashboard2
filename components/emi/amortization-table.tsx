"use client";

import { Download, Table as TableIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/emi-calculator";
import type { AmortizationEntry } from "@/lib/emi-calculator";

interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  isLoading?: boolean;
}

export function AmortizationTable({ schedule, isLoading }: AmortizationTableProps) {
  const exportToCSV = () => {
    const headers = ["Month", "EMI", "Principal Paid", "Interest Paid", "Extra Payment", "Remaining Balance"];
    const rows = schedule.map((entry) => [
      entry.month,
      entry.emi,
      entry.principal,
      entry.interest,
      entry.extraPayment || 0,
      entry.balance,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "amortization_schedule.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TableIcon className="h-5 w-5 text-primary" />
            Amortization Schedule
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    A detailed breakdown showing how each EMI payment is split between principal and interest over time
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={schedule.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {schedule.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Calculate EMI to see the amortization schedule
          </div>
        ) : (
          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-20 text-center">Month</TableHead>
                  <TableHead className="text-right">EMI</TableHead>
                  <TableHead className="text-right">Principal Paid</TableHead>
                  <TableHead className="text-right">Interest Paid</TableHead>
                  <TableHead className="text-right">Extra Payment</TableHead>
                  <TableHead className="text-right">Remaining Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((entry) => (
                  <TableRow key={entry.month}>
                    <TableCell className="text-center font-medium">{entry.month}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.emi)}</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(entry.principal)}</TableCell>
                    <TableCell className="text-right text-chart-2">{formatCurrency(entry.interest)}</TableCell>
                    <TableCell className={`text-right ${(entry.extraPayment || 0) > 0 ? "text-amber-500 font-semibold" : "text-muted-foreground"}`}>
                      {(entry.extraPayment || 0) > 0 ? formatCurrency(entry.extraPayment!) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
