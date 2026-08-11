function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(d));
}

export function subscriptionLabel(sub: {
  status: string;
  trialEndsAt: Date | string;
  nextBillingAt: Date | string | null;
}): string {
  switch (sub.status) {
    case "trial":
      return `Пробный период до ${formatDate(sub.trialEndsAt)}`;
    case "active":
      return sub.nextBillingAt ? `Активна, следующее списание ${formatDate(sub.nextBillingAt)}` : "Активна";
    case "past_due":
      return "Проблема с оплатой — доступ сохранён ещё на несколько дней";
    case "expired":
      return "Пробный период закончился";
    case "canceled":
      return "Подписка отменена";
    default:
      return sub.status;
  }
}
