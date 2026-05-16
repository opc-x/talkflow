import Link from "next/link";
import { Mic } from "lucide-react";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <Mic className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="font-bold text-xl text-foreground">TalkFlow</span>
    </Link>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-white">TalkFlow</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight text-balance">
              让口语练习变得简单有趣
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-md text-pretty">
              基于 Callan Method 的 AI 陪练，帮助你建立口语肌肉记忆，随时随地开口说英语。
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30" />
              <div className="w-10 h-10 rounded-full bg-white/30 border-2 border-white/30" />
              <div className="w-10 h-10 rounded-full bg-white/40 border-2 border-white/30" />
            </div>
            <p className="text-white/80 text-sm">
              已有 1000+ 用户在练习口语
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="p-6 lg:hidden">
          <Logo />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
        
        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 TalkFlow. 让口语流利起来。</p>
        </footer>
      </div>
    </div>
  );
}
