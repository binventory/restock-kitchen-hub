import { Component, type ReactNode, type ErrorInfo } from "react";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log full details to the developer console only.
    // Never display raw error messages to users — they can leak
    // database constraint names, schema details, or internal paths.
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <div className="max-w-md">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try reloading the page. If the problem persists,
              contact support.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
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