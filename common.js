const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const km = (n) => new Intl.NumberFormat('en-IN').format(n) + ' km';
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function carImage(c) {
  const name = esc(c.make + ' ' + c.model);
  if (!c.image) return `<div class="ph">${name}</div>`;
  return `<img src="${esc(c.image)}" alt="${name}" loading="lazy" onerror="this.outerHTML='<div class=&quot;ph&quot;>${name}</div>'">`;
}
