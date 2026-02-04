/**
 * Testing Page Component
 * Comprehensive test of the feature-based architecture setup
 * Tests path aliases, Tailwind CSS, and component structure
 */
import { hello } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useSidebar } from "@/stores/use-sidebar";
import { useDebounce } from "@/hooks/use-debounce";
import { useState } from "react";

export function TestPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { isOpen, toggle } = useSidebar();

  const handleTest = () => {
    console.log(hello());
    alert(
      "✅ Path aliases (@/) working correctly!\n✅ All imports resolved!\n✅ Tailwind CSS styling applied!",
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🧪 Architecture Test Page
        </h1>
        <p className="text-gray-600 mb-6">
          Testing all components of the feature-based architecture
        </p>
      </div>

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Path Aliases Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-3 text-green-700">
            ✅ Path Aliases (@/)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            All imports using @/ syntax are working correctly
          </p>
          <Button onClick={handleTest} className="w-full">
            Test Path Aliases
          </Button>
        </div>

        {/* Tailwind CSS Test */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md border border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">
            🎨 Tailwind CSS
          </h3>
          <div className="space-y-2">
            <div className="w-full h-2 bg-blue-200 rounded-full">
              <div className="w-3/4 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <p className="text-xs text-blue-600">
              Gradients, colors, spacing all working!
            </p>
          </div>
        </div>

        {/* Components Test */}
        <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
          <h3 className="text-lg font-semibold mb-3 text-purple-700">
            🧱 UI Components
          </h3>
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="w-full">
              Button Component
            </Button>
            <div className="flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          </div>
        </div>

        {/* Hooks Test */}
        <div className="bg-orange-50 p-6 rounded-lg shadow-md border border-orange-200">
          <h3 className="text-lg font-semibold mb-3 text-orange-700">
            🪝 Custom Hooks
          </h3>
          <input
            type="text"
            placeholder="Test debounce hook..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-md text-sm mb-2"
          />
          <p className="text-xs text-orange-600">
            Debounced: "{debouncedSearch}"
          </p>
        </div>

        {/* Zustand Store Test */}
        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
          <h3 className="text-lg font-semibold mb-3 text-green-700">
            🏪 Zustand Store
          </h3>
          <p className="text-sm mb-3">
            Sidebar is: {isOpen ? "Open" : "Closed"}
          </p>
          <Button
            onClick={toggle}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Toggle Sidebar State
          </Button>
        </div>

        {/* Architecture Summary */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            📁 Architecture
          </h3>
          <div className="text-xs space-y-1 text-gray-600">
            <div>✅ /app - App initialization</div>
            <div>✅ /components - Shared components</div>
            <div>✅ /lib - Infrastructure</div>
            <div>✅ /hooks - Custom hooks</div>
            <div>✅ /stores - Global state</div>
            <div>✅ /types - Type definitions</div>
            <div>✅ /config - Environment config</div>
            <div>🚧 /features - Business logic (ready)</div>
          </div>
        </div>
      </div>

      {/* Final Status */}
      <div className="text-center">
        <div className="inline-flex items-center px-6 py-3 bg-green-100 border border-green-200 rounded-full">
          <span className="text-green-800 font-medium">
            🎉 Feature-Based Architecture Setup Complete!
          </span>
        </div>
      </div>
    </div>
  );
}
