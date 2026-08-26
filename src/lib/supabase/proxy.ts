import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

function redirectWithSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  for (const [name, value] of sessionResponse.headers.entries()) {
    if (name.toLowerCase() !== "location") redirectResponse.headers.set(name, value);
  }
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) {
          supabaseResponse.headers.set(name, value);
        }
      },
    },
  });

  // getClaims verifies the JWT signature. Never authorize from getSession on the server.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const pathname = request.nextUrl.pathname;
  const isSignIn = pathname === "/signin";
  const isPasswordSetup = pathname === "/change-password";
  const mustChangePassword = claims?.app_metadata?.must_change_password === true;

  if (!claims && !isSignIn) {
    return redirectWithSession(request, supabaseResponse, "/signin");
  }

  if (claims && mustChangePassword && !isPasswordSetup) {
    return redirectWithSession(request, supabaseResponse, "/change-password");
  }

  if (claims && !mustChangePassword && isSignIn) {
    return redirectWithSession(request, supabaseResponse, "/");
  }

  return supabaseResponse;
}
