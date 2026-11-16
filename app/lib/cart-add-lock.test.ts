import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  holdCartAddLock,
  isCartAddLocked,
  resetCartAddLock,
  runExclusiveCartAdd,
  subscribeCartAddLock,
} from "./cart-add-lock";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  resetCartAddLock();
});

describe("cart-add-lock", () => {
  it("holdCartAddLock займає замок, а повторне звільнення нічого не ламає", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCartAddLock(listener);

    const releaseFirst = holdCartAddLock();
    const releaseSecond = holdCartAddLock();
    expect(isCartAddLocked()).toBe(true);

    releaseFirst();
    releaseFirst();
    expect(isCartAddLocked()).toBe(true);

    releaseSecond();
    expect(isCartAddLocked()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
  });

  it("runExclusiveCartAdd виконує завдання по одному, у порядку черги", async () => {
    const events: string[] = [];
    const gates = [deferred(), deferred(), deferred()];

    const runs = gates.map((gate, index) =>
      runExclusiveCartAdd(async () => {
        events.push(`start ${index}`);
        await gate.promise;
        events.push(`end ${index}`);
        return index;
      }),
    );
    await tick();

    expect(events).toEqual(["start 0"]);

    gates[0]?.resolve();
    await tick();
    expect(events).toEqual(["start 0", "end 0", "start 1"]);

    gates[1]?.resolve();
    gates[2]?.resolve();

    expect(await Promise.all(runs)).toEqual([0, 1, 2]);
    expect(events).toEqual(["start 0", "end 0", "start 1", "end 1", "start 2", "end 2"]);
    expect(isCartAddLocked()).toBe(false);
  });

  it("звільняє замок і тоді, коли завдання завершилось помилкою", async () => {
    await expect(
      runExclusiveCartAdd(async () => {
        throw new Error("мережа");
      }),
    ).rejects.toThrow("мережа");

    expect(isCartAddLocked()).toBe(false);
    await expect(runExclusiveCartAdd(async () => "ok")).resolves.toBe("ok");
  });

  it("чекає на замок, який тримає форма сторінки товару", async () => {
    const release = holdCartAddLock();
    const task = vi.fn(async () => "added");

    const run = runExclusiveCartAdd(task);
    await tick();
    expect(task).not.toHaveBeenCalled();

    release();
    await expect(run).resolves.toBe("added");
  });
});
