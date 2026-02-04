# Shadcn/UI Setup Documentation

## 📋 Tổng quan

Tài liệu này ghi lại quá trình cài đặt và cấu hình Shadcn/UI cho dự án AlgoMinds React client.

## ✅ Các bước đã hoàn thành

### 1. Cài đặt Dependencies

```bash
npm install class-variance-authority clsx tailwind-merge @radix-ui/react-slot tailwindcss-animate
```

### 2. Cấu hình components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### 3. Cập nhật Tailwind Config

Đã cập nhật `tailwind.config.js` với theme variables và animations:

```js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... other colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### 4. Cập nhật CSS Variables

Đã thêm CSS variables cho theme vào `src/app/index.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    /* ... other variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark theme variables */
  }
}
```

### 5. Các Components đã cài đặt

- ✅ Button (`@/components/ui/button`)
- ✅ Input (`@/components/ui/input`)
- ✅ Card (`@/components/ui/card`)
- ✅ Badge (`@/components/ui/badge`)
- ✅ Dialog (`@/components/ui/dialog`)
- ✅ Form (`@/components/ui/form`)
- ✅ Avatar (`@/components/ui/avatar`)
- ✅ Dropdown Menu (`@/components/ui/dropdown-menu`)
- ✅ Separator (`@/components/ui/separator`)
- ✅ Label (`@/components/ui/label`)

### 6. Centralized Exports

Tạo `src/components/ui/index.ts` để export tất cả components:

```ts
export * from "./button";
export * from "./input";
export * from "./card";
// ... other exports
```

### 7. Showcase Component

Tạo `ShadcnShowcase` component để demo tất cả UI components đã cài đặt.

## 🎯 Kết quả

- ✅ Shadcn/UI đã được tích hợp thành công
- ✅ Tất cả components hoạt động bình thường
- ✅ Theme system (light/dark) ready
- ✅ TypeScript support đầy đủ
- ✅ Path aliases (@/) hoạt động
- ✅ Tailwind CSS v4 compatibility

## 🚀 Sử dụng

```tsx
import { Button, Card, Badge } from "@/components/ui";

// Hoặc import riêng lẻ
import { Button } from "@/components/ui/button";
```

## 📝 Ghi chú

- Đã sử dụng Tailwind CSS v4, một số cú pháp khác với v3
- CSS variables được sử dụng thay vì hardcode colors
- Tất cả components đều có TypeScript types đầy đủ
- Ready để build các page Login/Register với UI components chuyên nghiệp

## ✨ Next Steps

Phase 4.3: Bắt đầu xây dựng UI cơ bản:

- Trang Login / Register sử dụng Button, Input, Card components
- Trang Dashboard với Card, Badge cho danh sách problems
- Navigation với Avatar, Dropdown Menu
