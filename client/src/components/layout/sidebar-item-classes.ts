import { cn } from "@/lib/utils";

export const sidebarItemClasses = (isActive: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 border-l-2 px-2.5 py-2 text-sm font-medium rounded-md transition-colors duration-150",
    isActive
      ? "border-primary bg-primary/15 text-primary"
      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
  );
