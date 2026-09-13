import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_UPDATED_AT } from "@/content/legal";

export const metadata = { title: "Политика конфиденциальности — NeuRoKey" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Политика конфиденциальности</h1>
      <p className="text-sm text-muted-foreground">Обновлено: {PRIVACY_POLICY_UPDATED_AT}</p>
      {PRIVACY_POLICY_SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{section.title}</h2>
          {section.body.map((paragraph, i) => (
            <p key={i} className="text-sm leading-6 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
