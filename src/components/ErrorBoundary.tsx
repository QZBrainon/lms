import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-red-500/50">Error</h1>
              <div className="h-1 w-20 bg-red-500 mx-auto mb-8"></div>
            </div>

            <h2 className="text-3xl font-bold mb-4">Something Went Wrong</h2>

            <p className="text-lg text-muted-foreground mb-4">
              We encountered an unexpected error. Please try reloading the page.
            </p>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={this.handleReload}
                size="lg"
                className="cursor-pointer"
              >
                Reload Page
              </Button>
              <Button
                onClick={this.handleReset}
                size="lg"
                variant="outline"
                className="cursor-pointer"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
