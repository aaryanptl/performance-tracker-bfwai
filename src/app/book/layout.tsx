import type { ReactNode } from "react";

import "./book.css";

/**
 * The record book sits outside the workspace shell deliberately: it is the
 * document people hand over in a promotion discussion, an audit or an exit, so
 * it carries no sidebar, no navigation and nothing that would print as chrome.
 */
export default function BookLayout({ children }: { children: ReactNode }) {
  return <div className="book">{children}</div>;
}
