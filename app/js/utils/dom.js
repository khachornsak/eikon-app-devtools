export function addHeader(elementId, columns) {
  let tds = columns.map(({ name, classNames, headerTooltip }) =>
    `<th class="${classNames || ''}" title="${headerTooltip || ''}">${name || ''}</th>`);
  let el = window.document.getElementById(elementId);
  if (el) el.innerHTML = `<tr>${tds.join('')}</tr>`;
}

export function createRow(columns, data = {}) {
  let tds = columns.map(({ classNames, field }) =>
    `<td class="${classNames || ''}">${data[field] || ''}</td>`);
  return `<tr>${tds.join('')}</tr>`;
}
