import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // 开发态左下角「N」是 Next Dev Tools，不是 Tab 栏；关掉以免和底部导航混在一起
  devIndicators: false,
};

export default withNextIntl(nextConfig);
