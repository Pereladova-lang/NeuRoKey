import { CONSENT_SECTIONS, CONSENT_UPDATED_AT } from "@/content/legal";

export const metadata = { title: "Согласие на обработку данных ребёнка — NeuRoKey" };

export default function ConsentPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Согласие на обработку персональных данных ребёнка</h1>
      <p className="text-sm text-muted-foreground">Обновлено: {CONSENT_UPDATED_AT}</p>
      {CONSENT_SECTIONS.map((section) => (
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
