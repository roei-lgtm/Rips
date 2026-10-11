import fs from "node:fs";
import sharp from "sharp";
const categories = [
  ["pokemon", "TRAINER", "#F5C84B", "CREATURE SERIES"],
  ["one-piece", "PIRATE", "#279BFA", "HIGH SEAS SERIES"],
  ["basketball", "HOOPS", "#F47A38", "COURTSIDE SERIES"],
  ["baseball", "ROOKIE", "#E9434C", "DIAMOND SERIES"],
];
export function symbol(category: string, color = "#18191d") {
  if (category === "pokemon")
    return `<path d="M0 -67 L24 -32 L61 -18 L37 16 L40 57 L0 40 L-40 57 L-37 16 L-61 -18 L-24 -32Z" fill="${color}"/><path d="M-12 -33 L16 -39 L2 -7 L23 -10 L-15 33 L-3 2 L-24 6Z" fill="#fff"/>`;
  if (category === "one-piece")
    return `<path d="M-23 -66 L23 -66 L23 15 L57 -5 L57 20 Q32 52 0 64 Q-32 52 -57 20 L-57 -5 L-23 15Z" fill="${color}"/><circle cy="-57" r="16" fill="none" stroke="#fff" stroke-width="7"/><path d="M-48 -22H48" stroke="${color}" stroke-width="10"/><path d="M-17 28L0 45L17 28" fill="none" stroke="#fff" stroke-width="5"/>`;
  if (category === "basketball")
    return `<circle r="62" fill="${color}"/><g fill="none" stroke="#fff" stroke-width="3.5"><circle r="54"/><path d="M-61 0H61M0 -61V61M-43 -43Q26 -3 43 43M43 -43Q-26 -3 -43 43"/></g>`;
  return `<circle r="62" fill="#fff" stroke="${color}" stroke-width="5"/><g stroke="${color}" fill="none" stroke-width="3"><path d="M-32 -54Q17 0 -32 54M32 -54Q-17 0 32 54"/>${[-40, -25, -10, 5, 20, 35].map((y) => `<path d="M${-21 + Math.abs(y) / 5} ${y}l-12 5M${21 - Math.abs(y) / 5} ${y}l12 5"/>`).join("")}</g>`;
}
const crown =
  '<path d="M-16 0L-20 -16L-7 -8L0 -23L7 -8L20 -16L16 0Z" fill="currentColor"/>';
async function main() {
  for (const [id, name, base, sub] of categories) {
    fs.writeFileSync(
      `public/assets/categories/${id}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-75 -75 150 150">${symbol(id, base)}</svg>`,
    );
    const dark = symbol(id, "#111116");
    const light = dark
      .replaceAll("#111116", "__INK__")
      .replaceAll("#fff", "#111116")
      .replaceAll("__INK__", "#fff");
    for (const [mode, art] of [
      ["dark", dark],
      ["light", light],
    ])
      fs.writeFileSync(
        `public/assets/categories/${id}-cta-${mode}.svg`,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-75 -75 150 150">${art}</svg>`,
      );
    for (let variant = 0; variant < 2; variant++) {
      const color = variant ? "#A899E9" : base;
      const title = variant ? "AFTER HOURS" : name;
      const ribs = Array.from(
        { length: 55 },
        (_, i) =>
          `<path d="M${29 + i * 5} 17v20M${29 + i * 5} 430v22" stroke="${i % 2 ? "#333" : "#fff"}" stroke-opacity=".24" stroke-width="2"/>`,
      ).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
 <defs><linearGradient id="foil" x1="0" x2="1" y1="0" y2=".2"><stop stop-color="#a5a8ad"/><stop offset=".09" stop-color="#f4f5f5"/><stop offset=".23" stop-color="#c7cbd0"/><stop offset=".45" stop-color="#fcfcfd"/><stop offset=".57" stop-color="#b9bec4"/><stop offset=".7" stop-color="#e4e7ea"/><stop offset=".88" stop-color="#fafafa"/><stop offset="1" stop-color="#959ba3"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="#16161d"/></linearGradient><linearGradient id="sheen"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".65"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="9" stdDeviation="8" flood-opacity=".28"/></filter><pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 0H3" stroke="#666" stroke-opacity=".08" stroke-width=".5"/></pattern></defs>
 <g filter="url(#shadow)"><path d="M27 17L333 17L326 39L328 430L333 452L27 452L32 428L31 38Z" fill="url(#foil)"/><path d="M30 40H330M30 428H330" stroke="#73787f" stroke-width="2"/>${ribs}<path d="M34 44L326 44L324 425L36 425Z" fill="url(#grain)"/>
 <path d="M36 242L326 152L322 340L37 401Z" fill="${color}"/><path d="M37 254L291 163L319 165L37 268ZM38 285L325 185L323 190L40 299ZM37 379L320 281L320 288L37 389" fill="#15151b" opacity=".9"/><path d="M36 363L324 251L324 275L36 387" fill="${color}"/>
 <g transform="translate(181 108) rotate(-7)" fill="#17171b"><text text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-style="italic" font-size="57" font-weight="900" letter-spacing="-5">RIPS</text><path d="M-72 8L71 0L58 10L-70 16"/><g transform="translate(58 -47) scale(.5)" style="color:#17171b">${crown}</g><text y="32" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" letter-spacing="4">BY LONESTAR</text></g>
 <g transform="translate(180 247) rotate(-9)"><circle r="82" fill="#f6f6f3" stroke="#17171b" stroke-width="3"/>${symbol(id)}<path d="M-63 -53L-53 -68L-37 -62" stroke="${color}" fill="none" stroke-width="8"/></g>
 <g transform="translate(283 184) rotate(12)"><path d="M0 -23L5 -9L20 -15L13 -2L26 4L10 8L14 23L0 15L-12 24L-10 9L-25 4L-13 -4L-20 -18L-5 -10Z" fill="${color}" stroke="#17171b" stroke-width="2"/><text y="4" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="10">R!</text></g>
 <g transform="translate(72 329) rotate(-13)" style="color:#17171b">${crown}</g><text x="180" y="375" text-anchor="middle" font-family="Arial Black,Arial" font-style="italic" font-weight="900" font-size="${variant ? 24 : 32}" letter-spacing="2" fill="#16161d">${title}</text><text x="180" y="397" text-anchor="middle" font-family="Arial" font-size="8" letter-spacing="3" fill="#333">${sub}</text><text x="180" y="417" text-anchor="middle" font-family="Arial" font-size="7" letter-spacing="2" fill="#555">ONE CARD. ENDLESS POSSIBILITY.</text>
 <path d="M43 45L61 45L51 425L40 425Z" fill="#fff" opacity=".55"/><path d="M298 42L318 42L319 428L311 428Z" fill="#000" opacity=".12"/><path d="M85 40L170 40L269 428L208 428Z" fill="url(#sheen)" opacity=".5"/><path d="M34 50Q170 64 326 48M34 418Q182 400 323 421" stroke="#fff" fill="none" opacity=".5"/>
 </g></svg>`;
      const slug = `${id}-${variant ? "after-hours" : name.toLowerCase()}`;
      fs.writeFileSync(`public/assets/packs/${slug}.svg`, svg);
      await sharp(Buffer.from(svg))
        .resize(900, 1200)
        .png()
        .toFile(`public/assets/packs/${slug}.png`);
    }
    for (let tier = 0; tier < 8; tier++) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="#14141c"/></linearGradient><radialGradient id="sun"><stop stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect x="5" y="5" width="290" height="410" rx="20" fill="#c5c8d1"/><rect x="12" y="12" width="276" height="396" rx="14" fill="#17171e"/><text x="28" y="44" fill="#fff" font-family="Arial" font-size="14" font-weight="bold">LONESTAR ORIGINALS</text><text x="28" y="63" fill="#aaa" font-family="Arial" font-size="9">DEMO EDITION · ${String(tier + 1).padStart(3, "0")}</text><rect x="24" y="80" width="252" height="250" rx="8" fill="url(#bg)"/>${Array.from({ length: 12 }, (_, i) => `<path d="M-30 ${90 + i * 24}L300 ${-20 + i * 24}" stroke="#fff" opacity=".07" stroke-width="10"/>`).join("")}<circle cx="150" cy="205" r="110" fill="url(#sun)"/><g transform="translate(150 207) scale(1.2)">${symbol(id)}</g><text x="28" y="359" fill="#fff" font-family="Arial" font-size="21" font-weight="bold">${["First Light", "Rising Star", "All Star", "Prime Edition", "Silver Legend", "Gold Legend", "Crown Jewel", "One of One"][tier]}</text><text x="28" y="383" fill="${base}" font-family="Arial" font-size="11" letter-spacing="2">${name} · ORIGINAL ART</text></svg>`;
      fs.writeFileSync(`public/assets/cards/${id}-${tier}.svg`, svg);
    }
  }
  fs.writeFileSync(
    "public/assets/brand/logo.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90" viewBox="0 0 180 90"><g fill="#f2f2f4" transform="rotate(-7 90 45)"><text x="5" y="65" font-family="Arial Black,Arial" font-style="italic" font-weight="900" font-size="70" letter-spacing="-6">RIPS</text><g transform="translate(152 18) scale(.65)" style="color:#f5c84b">${crown}</g><path d="M6 72L161 66L150 75L6 79"/></g></svg>`,
  );
  fs.writeFileSync(
    "public/assets/manifest.json",
    JSON.stringify(
      {
        license:
          "Original artwork created for RIPS demo; no third-party character art or logos.",
        packs: categories.flatMap(([id, name]) =>
          [0, 1].map((v) => ({
            category: id,
            asset: `/assets/packs/${id}-${v ? "after-hours" : name.toLowerCase()}.png`,
            editable: `/assets/packs/${id}-${v ? "after-hours" : name.toLowerCase()}.svg`,
            symbol: `/assets/categories/${id}.svg`,
          })),
        ),
      },
      null,
      2,
    ),
  );
}
main();
