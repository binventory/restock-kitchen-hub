import { Component, type ReactNode, type ErrorInfo } from "react";

interface State {
  hasError: boolean;
  message: string;
  stack: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, message: "", stack: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message ?? String(error),
      stack: error?.stack ?? "",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <div className="max-w-2xl w-full">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try reloading the page. If the problem persists, contact support.
            </p>
            <details className="mt-4 text-left bg-muted/40 rounded-lg p-3 text-xs">
              <summary className="cursor-pointer font-mono">Error details (tap to expand)</summary>
              <p className="mt-2 font-mono break-words">{this.state.message}</p>
              {this.state.stack && (
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[10px] opacity-80">
                  {this.state.stack}
                </pre>
              )}
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, message: "", stack: "" });
                location.reload();
              }}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
