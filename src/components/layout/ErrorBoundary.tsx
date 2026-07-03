"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught layout render error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#04050B] flex flex-col items-center justify-center p-6 text-white text-center font-mono">
          <div className="max-w-md p-8 rounded-3xl bg-red-950/20 border border-red-500/30 shadow-lg backdrop-blur-md">
            <h2 className="text-xl font-bold uppercase tracking-wider text-red-400 mb-4">Layout Core Anomaly</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              A runtime rendering mismatch occurred in the background grid system.
            </p>
            <pre className="p-4 bg-black/40 rounded-xl text-[10px] text-left text-red-300 overflow-x-auto border border-red-500/10 mb-6 max-h-40">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-2.5 bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 text-red-200 rounded-xl text-xs font-bold transition-all"
            >
              Re-initialize Render Node
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
