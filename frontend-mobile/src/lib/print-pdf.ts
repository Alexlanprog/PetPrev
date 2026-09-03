/** Opens a print-ready document so the tutor can save the prescription as PDF. */
export function printDocument(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #123; margin: 40px; line-height: 1.5; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .muted { color: #667; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
  th, td { border-bottom: 1px solid #dde; padding: 8px 6px; text-align: left; }
  footer { margin-top: 48px; border-top: 1px solid #dde; padding-top: 8px; font-size: 12px; color: #667; }
</style></head><body>${bodyHtml}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}
