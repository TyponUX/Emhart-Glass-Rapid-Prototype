import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ActionFeedback {
  itemName: string;
  destination: "cart" | "project";
  projectName?: string;
}

interface ActionFeedbackContextValue {
  feedback?: ActionFeedback;
  showFeedback: (feedback: ActionFeedback) => void;
  clearFeedback: () => void;
}

const ActionFeedbackContext = createContext<ActionFeedbackContextValue | undefined>(undefined);

export function ActionFeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<ActionFeedback>();

  const clearFeedback = useCallback(() => setFeedback(undefined), []);
  const showFeedback = useCallback((nextFeedback: ActionFeedback) => setFeedback(nextFeedback), []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(clearFeedback, 4000);
    return () => window.clearTimeout(timer);
  }, [clearFeedback, feedback]);

  return <ActionFeedbackContext.Provider value={{ feedback, showFeedback, clearFeedback }}>{children}</ActionFeedbackContext.Provider>;
}

export function useActionFeedback() {
  const context = useContext(ActionFeedbackContext);
  if (!context) throw new Error("useActionFeedback must be used inside ActionFeedbackProvider");
  return context;
}

export function ActionFeedbackToast() {
  const { feedback, clearFeedback } = useActionFeedback();
  if (!feedback) return null;

  return <div className="fixed right-5 top-5 z-50 w-[min(25rem,calc(100vw-2.5rem))] border border-green-200 bg-green-50 p-4 text-green-900 shadow-lg" role="status" aria-live="polite">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-700" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{feedback.itemName} added</p>
        <p className="mt-1">{feedback.destination === "cart" ? "Added to your basket." : <>Added to <strong>{feedback.projectName}</strong>.</>}</p>
      </div>
      <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-8 text-green-900 hover:bg-green-100" aria-label="Dismiss confirmation" onClick={clearFeedback}><X className="size-4" /></Button>
    </div>
  </div>;
}
