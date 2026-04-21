"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Expand, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AmortizationEntry } from "@/lib/emi-calculator";
import { getYearlyBreakdown, formatCurrency } from "@/lib/emi-calculator";

interface EMIChartsProps {
  principal: number;
  totalInterest: number;
  schedule: AmortizationEntry[];
  isLoading?: boolean;
}

const COLORS = {
  principal: "hsl(160, 60%, 45%)",
  interest: "hsl(45, 70%, 50%)",
};

type ChartType = "pie" | "line" | "bar" | null;

export function EMICharts({ principal, totalInterest, schedule, isLoading }: EMIChartsProps) {
  const [expandedChart, setExpandedChart] = useState<ChartType>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const expandedChartRef = useRef<HTMLDivElement>(null);

  const pieData = [
    { name: "Principal", value: principal },
    { name: "Interest", value: totalInterest },
  ];

  const yearlyData = getYearlyBreakdown(schedule);

  const balanceData = schedule
    .filter((_, index) => index % 3 === 0 || index === schedule.length - 1)
    .map((entry) => ({
      month: entry.month,
      balance: entry.balance,
    }));

  const downloadChart = useCallback((chartRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    const svg = chartElement.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = svg.clientWidth * 2;
    canvas.height = svg.clientHeight * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "hsl(var(--card))";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const totalAmount = principal + totalInterest;
  const principalPercent = ((principal / totalAmount) * 100).toFixed(1);
  const interestPercent = ((totalInterest / totalAmount) * 100).toFixed(1);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const chartVariants = {
    normal: { scale: 1, opacity: 1 },
    shrunk: { scale: 0.95, opacity: 0.5 },
    hidden: { scale: 0.9, opacity: 0 },
  };

  const renderChartCard = (
    type: ChartType,
    title: string,
    chartRef: React.RefObject<HTMLDivElement | null>,
    children: React.ReactNode
  ) => {
    const isExpanded = expandedChart === type;
    const shouldShrink = expandedChart !== null && !isExpanded;

    return (
      <motion.div
        layout
        variants={chartVariants}
        animate={shouldShrink ? "shrunk" : "normal"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={shouldShrink ? "pointer-events-none" : ""}
      >
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => downloadChart(chartRef, title.toLowerCase().replace(/\s+/g, "-"))}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download chart</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setExpandedChart(type)}
              >
                <Expand className="h-4 w-4" />
                <span className="sr-only">Expand chart</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} className="h-64">
              {children}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderExpandedModal = () => {
    if (!expandedChart) return null;

    const chartConfig = {
      pie: { title: "Principal vs Interest", ref: pieChartRef },
      line: { title: "Outstanding Balance", ref: lineChartRef },
      bar: { title: "Yearly Payment Breakdown", ref: barChartRef },
    };

    const config = chartConfig[expandedChart];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        onClick={() => setExpandedChart(null)}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-primary/20 shadow-2xl shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadChart(config.ref, config.title.toLowerCase().replace(/\s+/g, "-"))}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setExpandedChart(null)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[60vh] min-h-[400px]">
                {expandedChart === "pie" && renderPieChart(true)}
                {expandedChart === "line" && renderLineChart(true)}
                {expandedChart === "bar" && renderBarChart(true)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  const renderPieChart = (isExpanded: boolean = false) => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={isExpanded ? 100 : 60}
          outerRadius={isExpanded ? 150 : 90}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          <Cell fill={COLORS.principal} />
          <Cell fill={COLORS.interest} />
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e5e7eb",
          }}
          itemStyle={{ color: "#e5e7eb" }}
          labelStyle={{ color: "#e5e7eb" }}
        />
        <Legend
          wrapperStyle={{ color: "#e5e7eb" }}
          formatter={(value) => <span style={{ color: "#e5e7eb" }}>{value}</span>}
        />
        {/* Center Label */}
        <text
          x="50%"
          y="45%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e5e7eb"
          style={{ fontSize: isExpanded ? "14px" : "11px", fontWeight: 500 }}
        >
          {`Principal: ${principalPercent}%`}
        </text>
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e5e7eb"
          style={{ fontSize: isExpanded ? "14px" : "11px", fontWeight: 500 }}
        >
          {`Interest: ${interestPercent}%`}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );

  const renderLineChart = (isExpanded: boolean = false) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={balanceData}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.principal} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.principal} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.4} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: isExpanded ? 14 : 12, fill: "#94a3b8" }}
          stroke="#64748b"
          axisLine={{ stroke: "#64748b" }}
          tickLine={{ stroke: "#64748b" }}
          label={{
            value: "Month",
            position: "bottom",
            offset: -5,
            fontSize: isExpanded ? 14 : 12,
            fill: "#94a3b8",
          }}
        />
        <YAxis
          tick={{ fontSize: isExpanded ? 14 : 12, fill: "#94a3b8" }}
          stroke="#64748b"
          axisLine={{ stroke: "#64748b" }}
          tickLine={{ stroke: "#64748b" }}
          tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), "Balance"]}
          labelFormatter={(label) => `Month ${label}`}
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e5e7eb",
          }}
          itemStyle={{ color: "#e5e7eb" }}
          labelStyle={{ color: "#e5e7eb" }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke={COLORS.principal}
          strokeWidth={isExpanded ? 3 : 2}
          dot={false}
          name="Balance"
          animationBegin={0}
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = (isExpanded: boolean = false) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={yearlyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.4} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: isExpanded ? 14 : 12, fill: "#94a3b8" }}
          stroke="#64748b"
          axisLine={{ stroke: "#64748b" }}
          tickLine={{ stroke: "#64748b" }}
          label={{
            value: "Year",
            position: "bottom",
            offset: -5,
            fontSize: isExpanded ? 14 : 12,
            fill: "#94a3b8",
          }}
        />
        <YAxis
          tick={{ fontSize: isExpanded ? 14 : 12, fill: "#94a3b8" }}
          stroke="#64748b"
          axisLine={{ stroke: "#64748b" }}
          tickLine={{ stroke: "#64748b" }}
          tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          labelFormatter={(label) => `Year ${label}`}
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e5e7eb",
          }}
          itemStyle={{ color: "#e5e7eb" }}
          labelStyle={{ color: "#e5e7eb" }}
        />
        <Legend
          wrapperStyle={{ color: "#e5e7eb" }}
          formatter={(value) => <span style={{ color: "#e5e7eb" }}>{value}</span>}
        />
        <Bar
          dataKey="principal"
          fill={COLORS.principal}
          name="Principal"
          radius={[4, 4, 0, 0]}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="interest"
          fill={COLORS.interest}
          name="Interest"
          radius={[4, 4, 0, 0]}
          animationBegin={200}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderChartCard("pie", "Principal vs Interest", pieChartRef, renderPieChart())}
        {renderChartCard("line", "Outstanding Balance", lineChartRef, renderLineChart())}
        {renderChartCard("bar", "Yearly Payment Breakdown", barChartRef, renderBarChart())}
      </div>
      
      <AnimatePresence>{renderExpandedModal()}</AnimatePresence>
    </>
  );
}
