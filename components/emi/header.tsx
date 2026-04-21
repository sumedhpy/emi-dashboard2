"use client";

import { useState, useEffect } from "react";
import { Calculator, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Calculator className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Advanced EMI Calculator
            </h1>
            <p className="text-sm text-muted-foreground">
              Plan and analyze your loan repayments
            </p>
          </div>
        </div>
        {mounted && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              document.documentElement.classList.add("theme-transition");
              setTheme(theme === "dark" ? "light" : "dark");
              setTimeout(() => {
                document.documentElement.classList.remove("theme-transition");
              }, 300);
            }}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </div>
    </header>
  );
}
