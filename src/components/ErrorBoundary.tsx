import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('CLAUSETRACE Uncaught Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleCopyDetails = async () => {
    const details = `Error: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponentStack: ${this.state.errorInfo?.componentStack}`;
    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {}
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[400px] flex items-center justify-center p-6 bg-[#F8F9FA]"
        >
          <div className="max-w-lg w-full bg-white rounded-2xl border border-[#E0E2EC] p-6 sm:p-8 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#FFEDEA] text-[#BA1A1A] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <h2 className="text-xl font-medium text-[#1F1F1F] mb-2 font-display">
              {this.props.fallbackTitle || 'Something interrupted this view'}
            </h2>
            <p className="text-sm text-[#444746] mb-6">
              CLAUSETRACE preserved your documents safely in encrypted local storage. You can safely reload this module.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#004A77] text-white font-medium text-sm hover:bg-[#00385A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004A77] focus:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Reload View
              </button>

              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0E2EC] text-[#444746] font-medium text-sm hover:bg-[#F2F2F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004A77]"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#1E7E34]" aria-hidden="true" />
                    <span>Copied Details</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>Copy Diagnostic Details</span>
                  </>
                )}
              </button>
            </div>

            {this.state.error && (
              <div className="mt-6 text-left p-3 rounded-lg bg-[#F1F3F5] text-xs font-mono text-[#555] overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
