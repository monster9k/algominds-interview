import { Logo } from "@/components/ui/logo";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  alternativeLinkText: string;
  alternativeLink: string;
}

export function AuthLayout({
  children,
  title,
  description,
  alternativeLinkText,
  alternativeLink,
}: AuthLayoutProps) {
  return (
    <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* --- CỘT TRÁI: BRANDING (Đã nâng cấp) --- */}
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex overflow-hidden">
        {/* Layer 1: Background đen sâu */}
        <div className="absolute inset-0 bg-zinc-950" />

        {/* Layer 2: Grid Pattern tinh tế */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Layer 3: Radial Gradient (Spotlight) màu Rose Gold ở giữa */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.15)_0%,transparent_70%)]" />

        {/* Logo nhỏ góc trái */}
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Logo size="sm" />
        </div>

        {/* Nội dung chính ở giữa */}
        <div className="relative z-20 flex flex-1 flex-col items-center justify-center text-center">
          {/* Vòng tròn bao quanh Logo lớn */}
          <div className="mb-8 relative group">
            {/* Hiệu ứng Glow xoay vòng */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-rose-600 to-orange-600 opacity-30 group-hover:opacity-60 blur-lg transition duration-1000 group-hover:duration-200"></div>

            <div className="relative p-8 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-2xl">
              <Logo size="xl" iconOnly />
            </div>
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-white mb-4 drop-shadow-lg">
            Master Algorithms <br />
            <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              The Smart Way
            </span>
          </h2>

          <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
            Tham gia cùng hàng ngàn kỹ sư chinh phục Big Tech với sự trợ giúp
            của AI Interviewer.
          </p>
        </div>

        {/* Footer Quote */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2 border-l-2 border-rose-500 pl-6 bg-zinc-900/50 p-4 rounded-r-lg backdrop-blur-sm">
            <p className="text-lg italic text-zinc-200">
              "AlgoMinds không chỉ là nơi giải bài tập, đó là một đấu trường
              thực thụ giúp tôi rèn luyện tư duy."
            </p>
            <footer className="text-sm font-semibold text-rose-400">
              — Senior Engineer @ Netflix
            </footer>
          </blockquote>
        </div>
      </div>

      {/* --- CỘT PHẢI: FORM --- */}
      <div className="lg:p-8 flex items-center justify-center bg-background h-full relative">
        {/* Trang trí nhẹ bên phải */}
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
          <Logo size="xl" iconOnly className="text-zinc-800" />
        </div>

        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] relative z-10">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center lg:hidden mb-4">
              <Logo size="md" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>

          {children}

          <p className="text-muted-foreground px-8 text-center text-sm">
            <Link
              to={alternativeLink}
              className="hover:text-primary font-medium transition-colors underline underline-offset-4"
            >
              {alternativeLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
