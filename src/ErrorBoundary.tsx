import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fef2f2", color: "#991b1b", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Something went wrong.</h1>
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>Error:</p>
          <pre style={{ background: "#fee2e2", padding: "10px", borderRadius: "5px", overflow: "auto" }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>Component Stack:</p>
          <pre style={{ background: "#fee2e2", padding: "10px", borderRadius: "5px", overflow: "auto" }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
