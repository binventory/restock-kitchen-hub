import { Component, type ReactNode, type ErrorInfo } from "react";

const BUILD_TAG = "restock-eb-2026-05-22";

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
        <div className="min-h-screen bg-[var(--bg-page)] p-6">
          <div className="mx-auto max-w-2xl space-y-4">
            <h1 className="text-2xl font-bold">App error</h1>
            <p className="text-sm text-muted-foreground">
              The page crashed while rendering. Please reload. If it keeps failing, send a screenshot of the error below
              to support.
            </p>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <p className="font-semibold mb-2">Error message</p>
              <p className="font-mono break-words text-destructive">{this.state.message || "(no message)"}</p>
              {this.state.stack && (
                <>
                  <p className="font-semibold mt-3 mb-1">Stack</p>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[10px] opacity-80">
                    {this.state.stack}
                  </pre>
                </>
              )}
              <p className="mt-3 text-[10px] text-muted-foreground">Build: {BUILD_TAG}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, message: "", stack: "" });
                  location.reload();
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Reload
              </button>
              <a href="/" className="rounded-lg border px-4 py-2 text-sm font-medium">
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
