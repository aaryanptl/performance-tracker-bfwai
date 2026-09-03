"use client";

import { Menu } from "@base-ui/react/menu";
import { ArrowLeft, ChevronsUpDown, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/app/components/brand-logo";
import { signOut } from "@/app/signin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NAVIGATION, ROUTE_TITLES } from "@/data/navigation";
import { initials } from "@/data/people";
import { useSession } from "@/hooks/use-session";
import type { CycleSummary } from "@/lib/data/performance-types";

function titleForPath(pathname: string) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith("/coaching/coachees/")) {
    return {
      title: "Coachee record",
      description: "A complete view of this person's cycle and coaching activity.",
    };
  }
  if (pathname.startsWith("/coaching/check-ins/")) {
    return {
      title: "Coach check-in",
      description: "Record progress, blockers, support, and the next commitment.",
    };
  }
  if (pathname.startsWith("/coaching/reviews/")) {
    return {
      title: "Quarterly review",
      description: "Assess outcomes and behaviours using evidence from the cycle.",
    };
  }
  if (pathname.startsWith("/records/")) {
    return {
      title: "Performance record",
      description: "The person's charter, check-ins, impact, and scoring history.",
    };
  }
  return { title: "Ascend", description: "Performance management for Build Fast with AI." };
}

function backHrefForPath(pathname: string) {
  if (pathname === "/") return null;
  if (pathname === "/charter/edit") return "/charter";
  if (pathname.startsWith("/admin/") && pathname !== "/admin/dashboard") {
    return "/admin/dashboard";
  }
  if (pathname.startsWith("/coaching/check-ins/")) return "/coaching/coachees";
  if (pathname.startsWith("/coaching/reviews/")) return "/coaching/approvals";
  if (pathname.startsWith("/coaching/coachees/")) return "/coaching/coachees";
  if (pathname.startsWith("/records/")) return "/records";
  return "/";
}

function WorkspaceSidebar() {
  const pathname = usePathname();
  const { person } = useSession();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-2">
          <BrandLogo on="dark" className="h-9 shrink-0 group-data-[collapsible=icon]:h-7" />
          <span className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-semibold">Ascend</span>
            <span className="text-xs text-sidebar-foreground/60">Performance system</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAVIGATION.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(person.role),
          );
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.label}
                          onClick={() => setOpenMobile(false)}
                          render={<Link href={item.href} />}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Separator />
        <SidebarMenu>
          <SidebarMenuItem>
            <Menu.Root>
              <Menu.Trigger
                render={<SidebarMenuButton size="lg" tooltip={`${person.name} · ${person.role}`} />}
              >
                <span className="grid size-8 place-items-center rounded-full bg-primary/12 font-semibold text-primary">
                  {initials(person.name)}
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{person.name}</span>
                  <span className="truncate text-xs text-muted-foreground capitalize">
                    {person.role}
                  </span>
                </span>
                <ChevronsUpDown className="ml-auto" />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="right" align="end" sideOffset={8} className="z-50">
                  <Menu.Popup className="min-w-56 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg outline-none">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                    </div>
                    <Menu.Separator className="my-1 h-px bg-border" />
                    <Menu.LinkItem
                      render={<Link href="/change-password" />}
                      closeOnClick
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
                    >
                      <KeyRound className="size-4" />
                      Change password
                    </Menu.LinkItem>
                    <form action={signOut}>
                      <Menu.Item
                        nativeButton
                        render={<button type="submit" />}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive outline-none data-highlighted:bg-destructive/10"
                      >
                        <LogOut className="size-4" />
                        Sign out
                      </Menu.Item>
                    </form>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function WorkspaceHeader({ cycle }: { cycle: CycleSummary | null }) {
  const pathname = usePathname();
  const route = titleForPath(pathname);
  const backHref = backHrefForPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger />
      {backHref ? (
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={backHref} />}
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft />
          <span className="hidden sm:inline">Back</span>
        </Button>
      ) : null}
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold">{route.title}</p>
        <p className="hidden truncate text-xs text-muted-foreground lg:block">
          {route.description}
        </p>
      </div>
      <Badge variant="outline" className="hidden sm:inline-flex">
        {cycle ? cycle.status.replace(/_/g, " ") : "no cycle"}
      </Badge>
      {cycle ? (
        <NativeSelect
          aria-label="Active cycle"
          defaultValue={String(cycle.id)}
          className="hidden w-48 md:block"
        >
          <NativeSelectOption value={String(cycle.id)}>{cycle.name}</NativeSelectOption>
        </NativeSelect>
      ) : null}
    </header>
  );
}

export function AppShell({
  children,
  cycle,
}: {
  children: React.ReactNode;
  cycle: CycleSummary | null;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <WorkspaceSidebar />
        <SidebarInset>
          <WorkspaceHeader cycle={cycle} />
          <div className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
