import React, { useState, useEffect } from "react";
import { AlertOctagon, Clock } from "lucide-react";
import { firestoreCircuitBreaker, CircuitState } from "../services/firestoreCircuitBreaker";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export const CircuitBreakerAlert: React.FC = () => {
  const [circuitState, setCircuitState] = useState<CircuitState>(
    firestoreCircuitBreaker.getState()
  );
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const unsubscribe = firestoreCircuitBreaker.subscribe((state) => {
      setCircuitState(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (circuitState.isOpen && circuitState.cooldownEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.ceil(
          (circuitState.cooldownEndsAt! - Date.now()) / 1000
        );
        setCountdown(Math.max(0, remaining));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [circuitState]);

  if (!circuitState.isOpen) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className="mb-4 border-orange-500 bg-orange-50 text-orange-900"
    >
      <AlertOctagon className="h-4 w-4" />
      <AlertTitle className="font-bold">Sistema em Modo de Economia</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        <span>
          O sistema está temporariamente limitado para preservar recursos.
          {countdown > 0 && (
            <>
              {" "}
              Voltará ao normal em{" "}
              <span className="font-bold inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {countdown}s
              </span>
            </>
          )}
        </span>
      </AlertDescription>
    </Alert>
  );
};
