/**
 * Перехід усередині застосунку з коду, що живе поза React: дії в тостах (toast() викликається
 * зі сховищ обраного й порівняння). Корінь застосунку реєструє navigate роутера; поки його
 * немає (тест, сторінка помилки), перехід робить браузер.
 */
type Navigate = (to: string) => void | Promise<void>;

let registered: Navigate | null = null;

/** Викликається з кореня застосунку. Повертає функцію, що скасовує реєстрацію. */
export function registerAppNavigate(navigate: Navigate): () => void {
  registered = navigate;
  return () => {
    if (registered === navigate) registered = null;
  };
}

export function appNavigate(to: string): void {
  if (registered) void registered(to);
  else if (typeof window !== "undefined") window.location.assign(to);
}
