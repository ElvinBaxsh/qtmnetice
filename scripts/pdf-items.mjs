import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync, writeFileSync } from "fs";

const path = process.argv[2] || "/Users/user/Documents/Netice.pdf";
const outPath = process.argv[3];
const pageFilter = process.argv[4] ? Number(process.argv[4]) : null;

const data = new Uint8Array(readFileSync(path));
const doc = await getDocument({ data, useSystemFonts: true }).promise;

const allPages = [];
for (let i = 1; i <= doc.numPages; i++) {
  if (pageFilter && i !== pageFilter) continue;
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const items = content.items.map((it) => ({
    str: it.str,
    x: Math.round(it.transform[4] * 100) / 100,
    y: Math.round(it.transform[5] * 100) / 100,
  })).filter((it) => it.str.trim() !== "");
  allPages.push({ page: i, items });
}

if (outPath) {
  writeFileSync(outPath, JSON.stringify(allPages));
  console.log("wrote", outPath, allPages.length, "pages");
} else {
  console.log(JSON.stringify(allPages, null, 1));
}
