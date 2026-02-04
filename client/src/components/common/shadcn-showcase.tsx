/**
 * Shadcn/UI Showcase Component
 * Demonstrates các Shadcn/UI components đã cài đặt
 * Test component để kiểm tra UI library
 */
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
} from "@/components/ui";
import { Search, User, Settings, Code, Trophy } from "lucide-react";

export function ShadcnShowcase() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🎨 Shadcn/UI Showcase</h1>
        <p className="text-muted-foreground">
          Tất cả components đã được cài đặt và sẵn sàng sử dụng!
        </p>
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Các kiểu button khác nhau</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <User className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input và form components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="search" placeholder="Tìm kiếm..." className="pl-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      <Card>
        <CardHeader>
          <CardTitle>Data Display</CardTitle>
          <CardDescription>
            Avatar, Badge và các elements hiển thị
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <div className="flex space-x-2">
                <Badge>Interviewer</Badge>
                <Badge variant="secondary">Pro</Badge>
                <Badge variant="destructive">Admin</Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-blue-600" />
              <span className="text-sm">125 Problems Solved</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="text-sm">85% Success Rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="text-sm">Advanced Level</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Algorithm</span>
            </CardTitle>
            <CardDescription>Data Structures & Algorithms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Thực hành các thuật toán cơ bản đến nâng cao
            </p>
            <Button className="w-full">Bắt đầu</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Interview</span>
            </CardTitle>
            <CardDescription>Mock Interview Sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Phỏng vấn thực tế với AI hoặc con người
            </p>
            <Button variant="outline" className="w-full">
              Tham gia
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Leaderboard</span>
            </CardTitle>
            <CardDescription>Xếp hạng & Thành tích</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Xem thứ hạng và thành tích của bạn
            </p>
            <Button variant="secondary" className="w-full">
              Xem bảng xếp hạng
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Shadcn/UI Setup Complete!
            </h3>
            <p className="text-green-700">
              Tất cả components đã được cài đặt và hoạt động chính xác. Bạn có
              thể bắt đầu sử dụng cho dự án AlgoMinds!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
