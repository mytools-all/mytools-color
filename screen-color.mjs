export async function pickScreenColor({
  call,
  status,
  events = globalThis.document,
  wait = () => new Promise((resolve) => setTimeout(resolve, 1000)),
}) {
  const checked = (result) => {
    if (!/^#[\da-f]{6}$/i.test(result?.hex)) throw Error("宿主返回了无效的颜色");
    return { ...result, hex: result.hex.toUpperCase() };
  };
  let cancelled = false;
  const onKey = (event) => {
    if (event.key === "Escape") { cancelled = true; event.preventDefault(); }
  };
  events?.addEventListener("keydown", onKey, { capture: true });
  try {
    status("正在请求宿主取色权限…");
    await call("screen.pickcolor");
    for (let seconds = 3; seconds > 0; seconds--) {
      if (cancelled) return null;
      status(`${seconds} 秒后读取光标颜色，请将鼠标移到目标位置；Esc 取消`);
      await wait();
    }
    if (cancelled) return null;
    return checked(await call("screen.pickcolor"));
  } finally {
    events?.removeEventListener("keydown", onKey, { capture: true });
  }
}
