import { describe, expect, it } from "vitest";
import { reducer } from "./use-toast";

const makeToast = (id: string) => ({
  id,
  title: `Toast ${id}`,
  description: "",
  open: true,
});

describe("toast reducer", () => {
  it("adds toasts up to the limit", () => {
    const state = { toasts: [] };
    const withThree = ["1", "2", "3"].reduce(
      (acc, id) => reducer(acc, { type: "ADD_TOAST", toast: makeToast(id) }),
      state,
    );
    expect(withThree.toasts).toHaveLength(3);

    const withFour = reducer(withThree, { type: "ADD_TOAST", toast: makeToast("4") });
    expect(withFour.toasts).toHaveLength(3);
    expect(withFour.toasts[0].id).toBe("4"); // most recent kept
  });

  it("updates a toast by id", () => {
    const state = { toasts: [makeToast("1")] };
    const next = reducer(state, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "Updated" },
    });
    expect(next.toasts[0].title).toBe("Updated");
  });

  it("dismisses a specific toast", () => {
    const state = { toasts: [makeToast("1"), makeToast("2")] };
    const next = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });
    expect(next.toasts.find((t) => t.id === "1")?.open).toBe(false);
    expect(next.toasts.find((t) => t.id === "2")?.open).toBe(true);
  });

  it("removes a toast by id and clears all when toastId is undefined", () => {
    const state = { toasts: [makeToast("1"), makeToast("2")] };
    const afterRemove = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });
    expect(afterRemove.toasts.map((t) => t.id)).toEqual(["2"]);

    const cleared = reducer(state, { type: "REMOVE_TOAST" });
    expect(cleared.toasts).toEqual([]);
  });
});
