import React, { createContext, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right">("right");
  const [transitionTheme, setTransitionTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      const currentTheme = theme === "system" 
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
      
      const nextTheme = newTheme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : newTheme;

      // Determina direção da transição
      if (currentTheme === "light" && nextTheme === "dark") {
        setTransitionDirection("right");
      } else if (currentTheme === "dark" && nextTheme === "light") {
        setTransitionDirection("left");
      }

      setTransitionTheme(nextTheme);
      setIsTransitioning(true);
      
      setTimeout(() => {
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);
        
        setTimeout(() => {
          setIsTransitioning(false);
        }, 600);
      }, 300);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{
              x: transitionDirection === "right" ? "-100%" : "100%",
            }}
            animate={{
              x: "0%",
            }}
            exit={{
              x: transitionDirection === "right" ? "100%" : "-100%",
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{
              background: transitionTheme === "light" 
                ? "linear-gradient(to bottom, hsl(30, 100%, 85%) 0%, hsl(28, 100%, 80%) 10%, hsl(25, 100%, 75%) 20%, hsl(22, 100%, 70%) 30%, hsl(20, 100%, 65%) 40%, hsl(18, 100%, 60%) 50%, hsl(15, 100%, 55%) 60%, hsl(12, 100%, 50%) 70%, hsl(10, 100%, 45%) 80%, hsl(8, 100%, 40%) 90%, hsl(5, 100%, 35%) 100%)"
                : "hsl(222 47% 8%)",
            }}
          />
        )}
      </AnimatePresence>
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
