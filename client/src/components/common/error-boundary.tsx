import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import i18n from "@/lib/i18n";
import { captureException } from "@/lib/monitoring";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Error boundary phải là class component — React chưa có hook tương đương
// cho componentDidCatch/getDerivedStateFromError.
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught render error:", error, errorInfo);
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-4 text-foreground px-6 text-center">
          <p className="text-lg font-semibold">
            {i18n.t("errorBoundary.title", { ns: "common" })}
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            {i18n.t("errorBoundary.description", { ns: "common" })}
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            {i18n.t("errorBoundary.reload", { ns: "common" })}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
