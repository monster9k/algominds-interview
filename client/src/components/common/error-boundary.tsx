import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
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
        <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-100 px-6 text-center">
          <p className="text-lg font-semibold">Đã có lỗi xảy ra.</p>
          <p className="text-sm text-zinc-400 max-w-md">
            Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang — nếu
            lỗi vẫn tiếp diễn, hãy báo cho đội ngũ hỗ trợ.
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
