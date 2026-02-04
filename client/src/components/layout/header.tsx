/**
 * Header Layout Component
 * Main navigation header for the application
 * Contains logo, navigation links, and user menu
 */
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/stores/use-sidebar";

export function Header() {
  const { toggle } = useSidebar();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>

        <div className="flex items-center space-x-4 ml-4">
          <h1 className="text-xl font-semibold">AlgoMinds</h1>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <nav className="hidden md:flex space-x-4">
            <a href="#" className="text-sm font-medium hover:text-blue-600">
              Problems
            </a>
            <a href="#" className="text-sm font-medium hover:text-blue-600">
              Interview
            </a>
          </nav>

          <Button variant="outline" size="sm">
            Login
          </Button>
        </div>
      </div>
    </header>
  );
}
