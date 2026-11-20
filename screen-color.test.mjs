import test from "node:test";
import assert from "node:assert/strict";
import { pickScreenColor } from "./screen-color.mjs";

test("native fallback requests permission before countdown and reads the final cursor", async () => {
  const steps = [];
  const result = await pickScreenColor({
    call: async (id) => { steps.push(id); return { hex: "#aabbcc", x: 20, y: 30 }; },
    status: (text) => steps.push(text),
    wait: async () => { steps.push("wait"); },
    events: new EventTarget(),
  });
  assert.equal(result.hex, "#AABBCC");
  assert.equal(result.x, 20);
  assert.equal(steps.filter((step) => step === "screen.pickcolor").length, 2);
  assert.equal(steps.filter((step) => step === "wait").length, 3);
  assert.ok(steps.indexOf("screen.pickcolor") < steps.indexOf("wait"));
});

test("a browser picker that never responds cannot block the host sampling path", async () => {
  let opened = false;
  const result = await pickScreenColor({
    EyeDropper: class { open() { opened = true; return new Promise(() => {}); } },
    call: async () => ({ hex: "#123abc" }), status() {}, wait: async () => {},
  });
  assert.equal(result.hex, "#123ABC");
  assert.equal(opened, false);
});

test("Esc while permission is pending cancels without a second read", async () => {
  const events = new EventTarget();
  let grant;
  let calls = 0;
  const pending = pickScreenColor({
    call: () => { calls++; return new Promise((resolve) => { grant = resolve; }); },
    status() {}, wait: () => assert.fail("must not wait after cancellation"), events,
  });
  const escape = new Event("keydown", { cancelable: true });
  Object.defineProperty(escape, "key", { value: "Escape" });
  events.dispatchEvent(escape);
  grant({ hex: "#000000" });
  assert.equal(await pending, null);
  assert.equal(calls, 1);
});

test("Esc cancels delayed sampling and removes the key listener", async () => {
  const events = new EventTarget();
  let calls = 0;
  const result = await pickScreenColor({
    call: async () => { calls++; return { hex: "#abcdef" }; }, status() {}, events,
    wait: async () => {
      const event = new Event("keydown", { cancelable: true });
      Object.defineProperty(event, "key", { value: "Escape" });
      events.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
    },
  });
  assert.equal(result, null);
  assert.equal(calls, 1);
  const after = new Event("keydown", { cancelable: true });
  Object.defineProperty(after, "key", { value: "Escape" });
  events.dispatchEvent(after);
  assert.equal(after.defaultPrevented, false);
});

test("permission failure stops before waiting; malformed colors fail visibly", async () => {
  await assert.rejects(pickScreenColor({
    call: async () => { throw Error("权限被拒绝"); }, status() {}, wait: () => assert.fail("must not count down"),
  }), /权限被拒绝/);
  await assert.rejects(pickScreenColor({
    call: async () => ({ hex: "not a color" }), status() {}, wait: async () => {},
  }), /无效的颜色/);
});
