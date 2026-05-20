import type { DashboardContentProps } from "@/components/dashboard-content";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function formatDate() {
  const d = new Date();
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${days[d.getDay()]}`;
}

function baseProps(locale: string): Pick<
  DashboardContentProps,
  | "displayName"
  | "greeting"
  | "dateStr"
  | "onboardingHref"
  | "reviewHref"
  | "mapHref"
  | "resumeHref"
> {
  return {
    displayName: "预览用户",
    greeting: getGreeting(),
    dateStr: formatDate(),
    onboardingHref: `/${locale}/onboarding`,
    reviewHref: `/${locale}/protected/review`,
    mapHref: `/${locale}/protected/map`,
    resumeHref: `/${locale}/protected/learn/1/8`,
  };
}

/** 新用户首页（无 current_lesson_id） */
export function newUserDashboardPreview(
  locale: string,
): DashboardContentProps {
  return {
    ...baseProps(locale),
    hasProgress: false,
    reviewCount: 0,
    currentLesson: undefined,
    vocabPreview: null,
    sceneImageUrl: null,
    stageName: "入门",
    stageEmoji: "🌱",
    stagePct: 0,
    stageIndex: 1,
  };
}

/** 老用户首页（有进度 + 绿色开口练习卡） */
export function returningUserDashboardPreview(
  locale: string,
  sceneImageUrl?: string | null,
): DashboardContentProps {
  return {
    ...baseProps(locale),
    hasProgress: true,
    reviewCount: 12,
    currentLesson: 8,
    vocabPreview: "pen · pencil · book · table",
    sceneImageUrl: sceneImageUrl ?? null,
    stageName: "入门",
    stageEmoji: "🌱",
    stagePct: 42,
    stageIndex: 1,
  };
}
