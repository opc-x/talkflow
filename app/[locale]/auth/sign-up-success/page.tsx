import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                注册成功！
              </CardTitle>
              <CardDescription>请查收确认邮件</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                我们已向你的邮箱发送了一封确认邮件，请点击邮件中的链接激活账户后登录。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
