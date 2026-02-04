/**
 * Main Application Component
 * Entry point for the React application using feature-based architecture
 * Tests path aliases and Tailwind CSS functionality
 */
import { hello } from "@/lib/utils";
import { AppRouter } from "@/app/router";
import { Providers } from "@/app/provider";
import { TestPage } from "@/components/common/test-page";
import { ShadcnShowcase } from "@/components/common/shadcn-showcase";

function App() {
  // Test the path alias functionality
  console.log(hello());

  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Test Tailwind CSS with multiple utility classes */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center mb-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                AlgoMinds 🚀
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Feature-Based Architecture Setup Complete!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✅ Path Aliases (@/)
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  ✅ Tailwind CSS
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  ✅ React Query
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  ✅ Zustand
                </span>
              </div>
            </div>
          </div>

          {/* Test various Tailwind classes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Components
              </h3>
              <p className="text-gray-600 text-sm">
                Shared UI components ready for development
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Features
              </h3>
              <p className="text-gray-600 text-sm">
                Modular feature-based architecture
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Utils
              </h3>
              <p className="text-gray-600 text-sm">
                Utility functions and configurations
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Test Page */}
        <TestPage />

        {/* Shadcn/UI Components Showcase */}
        <ShadcnShowcase />

        {/* Router will handle all routing */}
        {/* <AppRouter /> */}
      </div>
    </Providers>
  );
}

export default App;
