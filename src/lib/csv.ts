export type CsvValue = string | number | null | undefined;
export type CsvRow = readonly CsvValue[];

function escapeCsvValue(value: CsvValue) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvFromRows(rows: readonly CsvRow[]) {
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}
