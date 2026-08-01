/**
 * Main Application Component
 * Entry point for the React application using feature-based architecture
 * Tests path aliases and Tailwind CSS functionality
 */
import { AppRouter } from "@/app/router";
import { Providers } from "@/app/provider";
import { ErrorBoundary } from "@/components/common/error-boundary";

function App() {
  return (
    <ErrorBoundary>
      <Providers>
        {/* Router will handle all routing */}
        <AppRouter />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
