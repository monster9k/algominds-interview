import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 bg-zinc-950 w-64 border-zinc-800"
          >
            <DashboardSidebar />
          </SheetContent>
        </Sheet>
        <Logo size="sm" iconOnly />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Username</p>
                <p className="text-xs leading-none text-muted-foreground">
                  user@algominds.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:text-red-500">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
