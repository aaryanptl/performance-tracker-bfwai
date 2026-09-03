"use client";

/** Opens the browser print dialog, which is also how a reader saves a PDF. */
export function PrintButton() {
  return (
    <div className="toolbar">
      <button type="button" onClick={() => window.print()}>
        Print / Save as PDF
      </button>
    </div>
  );
}
