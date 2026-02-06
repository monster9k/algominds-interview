/**
 * Main Application Component
 * Entry point for the React application using feature-based architecture
 * Tests path aliases and Tailwind CSS functionality
 */
import { hello } from "@/lib/utils";
import { AppRouter } from "@/app/router";
import { Providers } from "@/app/provider";

function App() {
  return (
    <Providers>
      {/* Router will handle all routing */}
      <AppRouter />
    </Providers>
  );
}

export default App;
