/**
 * Спільний замок на додавання в кошик — один на всю сторінку, а не на компонент.
 *
 * Поки кошика ще немає, перше додавання його створює. Якщо в цей момент полетить друге
 * (з іншої картки чи з форми на сторінці товару), Shopify створить два кошики, і покупець
 * побачить лише один із них. Тому додавання йдуть по одному: наступне чекає, доки попереднє
 * отримає відповідь. Замок тримають і «Купити» з картки (~/hooks/use-add-to-cart),
 * і форма сторінки товару, доки її запит у дорозі.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let holders = 0;

function emit(): void {
  for (const listener of [...listeners]) listener();
}

export function subscribeCartAddLock(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Чи є зараз додавання, яке ще не отримало відповіді. */
export function isCartAddLocked(): boolean {
  return holders > 0;
}

/** Займає замок; повертає функцію, яка його звільняє (повторний виклик нічого не робить). */
export function holdCartAddLock(): () => void {
  holders += 1;
  emit();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders = Math.max(0, holders - 1);
    emit();
  };
}

function whenUnlocked(): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = subscribeCartAddLock(() => {
      if (holders > 0) return;
      unsubscribe();
      resolve();
    });
  });
}

/** Виконує додавання наодинці: чекає, доки звільниться замок, і тримає його до відповіді. */
export async function runExclusiveCartAdd<Result>(task: () => Promise<Result>): Promise<Result> {
  // Після пробудження перевіряємо ще раз: замок міг зайняти той, хто чекав поруч.
  while (holders > 0) await whenUnlocked();

  const release = holdCartAddLock();
  try {
    return await task();
  } finally {
    release();
  }
}

/** Лише для тестів: скидає замок між сценаріями. */
export function resetCartAddLock(): void {
  holders = 0;
  emit();
}
