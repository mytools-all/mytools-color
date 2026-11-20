import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { Window } from "happy-dom";
import { pickScreenColor } from "./screen-color.mjs";

test("actual screen button updates color and recovers from permission denial", async () => {
  const window = new Window();
  try {
    window.document.write(readFileSync(new URL("index.html", import.meta.url), "utf8").replace(/<script[\s\S]*?<\/script>/g, ""));
    let denied = false;
    const context = vm.createContext({ window, document: window.document, localStorage: window.localStorage,
      matchMedia: window.matchMedia.bind(window), setTimeout, clearTimeout,
      pickScreenColor: (options) => pickScreenColor({ ...options, events: window.document, wait: async () => {} }),
    });
    window.mytools = { onPluginReady() {}, async call() { if (denied) throw Error("权限被拒绝"); return { hex: "#123abc" }; } };
    vm.runInContext(readFileSync(new URL("common.mjs", import.meta.url), "utf8").replace(/export /g, ""), context);
    vm.runInContext(readFileSync(new URL("app.mjs", import.meta.url), "utf8").replace(/import[\s\S]*?from\s+"[^"]+";/g, ""), context);
    const button = window.document.querySelector("#screen");
    const pending = button.onclick();
    assert.equal(button.disabled, true);
    await pending;
    assert.equal(window.document.querySelector("#hex").value, "#123ABC");
    assert.equal(button.disabled, false);
    denied = true;
    await button.onclick();
    assert.equal(button.disabled, false);
    assert.match(window.document.querySelector("#status").textContent, /权限被拒绝/);
  } finally { window.close(); }
});
