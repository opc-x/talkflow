import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, MessageCircle, Trophy, Zap, ArrowRight, Volume2, CheckCircle2 } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <Mic className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className="font-bold text-xl text-foreground">TalkFlow</span>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border card-hover">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {step}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <div className="w-full">
      {/* Navigation */}
      <nav className="w-full border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                登录
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                免费开始
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            基于 Callan Method 的 AI 陪练
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 text-balance">
            你的 AI 英语口语
            <span className="gradient-text block mt-2">私人语伴</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed text-pretty max-w-2xl mx-auto">
            已经能基础开口？TalkFlow 帮你用 AI 替代课堂老师陪练，
            随时随地进行高频重复练习，让口语更流利。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-lg btn-glow">
                开始免费练习
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="h-12 text-lg border-border text-foreground hover:bg-muted">
                了解更多
              </Button>
            </Link>
          </div>
        </div>

        {/* Demo Preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-accent/50" />
              <div className="w-3 h-3 rounded-full bg-primary/50" />
            </div>
            
            <div className="space-y-4">
              {/* AI Question */}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 inline-block">
                    <p className="text-foreground font-medium">{"What's this?"}</p>
                    <p className="text-muted-foreground text-sm mt-1">这是什么？</p>
                  </div>
                </div>
              </div>
              
              {/* User Response */}
              <div className="flex gap-3 justify-end">
                <div className="flex-1 text-right">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 inline-block">
                    <p className="font-medium">{"This is a pen."}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">发音准确</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 text-accent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              为什么选择 TalkFlow？
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
              专为已学过 Callan Method Stage 3+ 的学习者设计，填补课堂练习时间不足的空白
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={MessageCircle}
              title="AI 即时对话"
              description="模拟真实 Callan 课堂对话，AI 快速提问，你快速回答，建立口语肌肉记忆"
            />
            <FeatureCard
              icon={Mic}
              title="实时语音反馈"
              description="AI 实时评估你的发音和语法，给出精准纠正建议，让每次练习都有收获"
            />
            <FeatureCard
              icon={Trophy}
              title="游戏化激励"
              description="完成练习获得积分和成就，保持学习热情，让坚持变得更容易"
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              如何开始？
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
              三步开始你的口语陪练之旅
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto space-y-8">
            <StepCard
              step={1}
              title="选择你的 Stage"
              description="根据你在 Callan Method 的学习进度，选择对应的课程内容"
            />
            <div className="ml-5 h-8 border-l-2 border-dashed border-border" />
            <StepCard
              step={2}
              title="开始对话练习"
              description="AI 会按照 Callan 方法快速提问，你用语音回答，建立条件反射"
            />
            <div className="ml-5 h-8 border-l-2 border-dashed border-border" />
            <StepCard
              step={3}
              title="查看反馈和进步"
              description="每次练习后查看发音评分和纠正建议，追踪你的流利度提升"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 text-balance">
            准备好开口说英语了吗？
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto text-pretty">
            加入 TalkFlow，让 AI 成为你的专属语伴，随时陪你练口语
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 h-12 text-lg">
              免费注册开始
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} TalkFlow. 让口语流利起来。
          </p>
        </div>
      </footer>
    </div>
  );
}
