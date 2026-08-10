import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { POST as registerHandler } from "@/app/api/register/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function ParentAuthPage() {
  const session = await auth();
  if (session?.user?.parentId) redirect("/parent/dashboard");

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    await signIn("credentials", { email, password, redirectTo: "/parent/dashboard" });
  }

  async function register(formData: FormData) {
    "use server";
    const body = {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      childName: String(formData.get("childName")),
      childAge: Number(formData.get("childAge")),
      childPin: String(formData.get("childPin")),
    };
    const req = new Request("http://internal/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const res = await registerHandler(req);
    if (res.status !== 200) return;
    await signIn("credentials", { email: body.email, password: body.password, redirectTo: "/parent/dashboard" });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-6">
      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Вход</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={login} className="flex flex-col gap-3">
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="password" type="password" placeholder="Пароль" required minLength={8} />
              <Button type="submit">Войти</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Регистрация</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={register} className="flex flex-col gap-3">
              <Input name="email" type="email" placeholder="Email родителя" required />
              <Input name="password" type="password" placeholder="Пароль (мин. 8 символов)" required minLength={8} />
              <Input name="childName" placeholder="Имя ребёнка" required />
              <Input name="childAge" type="number" min={11} max={14} placeholder="Возраст (11–14)" required />
              <Input name="childPin" placeholder="PIN ребёнка (4 цифры)" required pattern="\d{4}" maxLength={4} />
              <Button type="submit" variant="secondary">
                Зарегистрироваться
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
