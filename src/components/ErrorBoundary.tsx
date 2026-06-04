import React, { ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public state: State;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let details = "";
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = "Security or Validation Error";
            details = parsed.error;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">{errorMessage}</h1>
            {details && <p className="text-slate-500 font-medium mb-6 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">{details}</p>}
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">
              Please try refreshing the page or contact the administrator if the issue persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              <RefreshCcw size={20} />
              Refresh System
            </button>
          </div>
        </div>
      );
    }

    const props = (this as any).props;
    return props && props.children;
  }
}
