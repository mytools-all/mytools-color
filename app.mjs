import {
  $,
  $$,
  action,
  copy,
  status,
  ready,
  call,
  escapeHtml,
} from "./common.mjs";
let current = "#409EFF",
  favorites = [];
function rgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
function hsl(hex) {
  let [r, g, b] = rgb(hex).map((n) => n / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
  }
  return [
    Math.round((h * 60 + 360) % 360),
    Math.round(s * 100),
    Math.round(l * 100),
  ];
}
function fromHsl(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2;
  const v =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return (
    "#" +
    v
      .map((n) =>
        Math.round((n + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
function update(hex) {
  if (/^#[\da-f]{3}$/i.test(hex))
    hex =
      "#" +
      hex
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("");
  if (!/^#[\da-f]{6}$/i.test(hex)) throw Error("请输入有效的 HEX 颜色");
  current = hex.toUpperCase();
  $("#hex").value = current;
  $("#picker").value = current;
  $("#swatch").style.background = current;
  $("#rgb").value = rgb(current).join(", ");
  $("#hsl").value = hsl(current).join(", ");
  status("颜色已更新");
}
$("#picker").oninput = () => update($("#picker").value);
$("#hex").onchange = action(() => update($("#hex").value));
$("#rgb").onchange = action(() => {
  const v = $("#rgb")
    .value.match(/-?[\d.]+/g)
    ?.map(Number);
  if (!v || v.length !== 3 || v.some((n) => n < 0 || n > 255))
    throw Error("RGB 需要三个 0–255 的数值");
  update(
    "#" + v.map((n) => Math.round(n).toString(16).padStart(2, "0")).join(""),
  );
});
$("#hsl").onchange = action(() => {
  const v = $("#hsl")
    .value.match(/-?[\d.]+/g)
    ?.map(Number);
  if (
    !v ||
    v.length !== 3 ||
    v.some((n) => n < 0) ||
    v[0] > 360 ||
    v[1] > 100 ||
    v[2] > 100
  )
    throw Error("HSL 范围：H 0–360，S/L 0–100");
  update(fromHsl(...v));
});
$("#copy").onclick = action(() => copy(current));
function renderFavorites() {
  $("#favorites").innerHTML = favorites
    .map(
      (c) =>
        '<button data-color="' +
        c +
        '" style="background:' +
        c +
        ";color:" +
        (hsl(c)[2] > 60 ? "#222" : "#fff") +
        '">' +
        c +
        "</button>",
    )
    .join("");
  $$("#favorites button").forEach(
    (b) => (b.onclick = () => update(b.dataset.color)),
  );
}
$("#favorite").onclick = action(async () => {
  favorites = [...new Set([...favorites, current])].slice(-30);
  renderFavorites();
  await call("storage.set", { key: "favorites", value: favorites });
  status("已收藏颜色");
});
$("#screen").onclick = action(async () => {
  if (!window.EyeDropper)
    throw Error("此 WebView 不支持屏幕取色，请使用屏幕取色器工具");
  try {
    update((await new EyeDropper().open()).sRGBHex);
  } catch (e) {
    if (e.name !== "AbortError") throw e;
    status("已取消取色");
  }
});
function palettes() {
  const [h, s, l] = hsl($("#base").value);
  $("#schemes").innerHTML = [
    ["互补色", [0, 180]],
    ["类似色", [-30, 0, 30]],
    ["对比色", [0, 120, 240]],
    ["中差色", [0, 90, 180, 270]],
  ]
    .map(
      ([name, angles]) =>
        "<div><p>" +
        name +
        '</p><div class="scheme">' +
        angles
          .map((a) => {
            const c = fromHsl((h + a + 360) % 360, s, l).toUpperCase();
            return (
              '<button data-color="' +
              c +
              '" style="background:' +
              c +
              ";color:" +
              (l > 60 ? "#222" : "white") +
              '">' +
              c +
              "</button>"
            );
          })
          .join("") +
        "</div></div>",
    )
    .join("");
  $$("#schemes button").forEach(
    (b) => (b.onclick = action(() => copy(b.dataset.color))),
  );
}
function contrast() {
  const fg = $("#fg").value,
    bg = $("#bg").value;
  const luminance = (c) =>
    rgb(c)
      .map((n) => {
        n /= 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      })
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const a = luminance(fg),
    b = luminance(bg),
    r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  $("#contrast-preview").style.color = fg;
  $("#contrast-preview").style.background = bg;
  $("#ratio").textContent = r.toFixed(2) + " : 1";
  $("#wcag").textContent =
    "WCAG AA 正文 " +
    (r >= 4.5 ? "通过" : "未通过") +
    " · AAA 正文 " +
    (r >= 7 ? "通过" : "未通过") +
    " · 大字 " +
    (r >= 3 ? "通过" : "未通过");
}
$$("#tabs button").forEach(
  (b) =>
    (b.onclick = () => {
      $$("#tabs button").forEach((x) => x.classList.toggle("active", x === b));
      for (const id of ["convert", "palette", "contrast"])
        $("#" + id).classList.toggle("hidden", id !== b.dataset.tab);
    }),
);
$("#base").oninput = palettes;
$("#fg").oninput = contrast;
$("#bg").oninput = contrast;
update(current);
palettes();
contrast();
ready(async () => {
  const saved = await call("storage.get", { key: "favorites" });
  if (Array.isArray(saved))
    favorites = saved.filter((c) => /^#[\da-f]{6}$/i.test(c));
  renderFavorites();
});
