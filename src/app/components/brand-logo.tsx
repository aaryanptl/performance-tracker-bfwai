import Image from "next/image";

import { cn } from "@/lib/utils";

/** Intrinsic size of the Build Fast with AI lockup (public/logo/*.svg). */
const LOGO_WIDTH = 546;
const LOGO_HEIGHT = 392;

/**
 * The Build Fast with AI wordmark.
 *
 * `on` names the surface the mark sits on, not the artwork: `on="dark"` picks
 * the white-text variant, `on="light"` picks the black-text one. Both keep the
 * brand blue (#1CA4F1) baked into the file — the SVGs are served through
 * next/image unoptimized, so their fills are fixed and cannot take currentColor.
 *
 * Size it by height (`className="h-10"`); the width follows the aspect ratio.
 */
export function BrandLogo({
  on = "light",
  className,
}: {
  on?: "light" | "dark";
  className?: string;
}) {
  return (
    <Image
      src={on === "dark" ? "/logo/light.svg" : "/logo/dark.svg"}
      alt="Build Fast with AI"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      unoptimized
      priority
      className={cn("h-10 w-auto", className)}
    />
  );
}
