"use client";

import { ChevronsUpDown, LogOut, Mountain } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/signin/actions";
import { Badge } from "@/components/ui/badge";
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
import { ACTIVE_CYCLE } from "@/data/performance";
import { useSession } from "@/hooks/use-session";

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

function WorkspaceSidebar() {
  const pathname = usePathname();
  const { person } = useSession();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Mountain className="size-5" />
          </span>
          <span className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-semibold">Ascend</span>
            <span className="text-xs text-muted-foreground">Performance system</span>
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
            <SidebarMenuButton
              size="lg"
              tooltip={`${person.name} · ${person.role}`}
              render={<Link href="/change-password" />}
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
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton tooltip="Sign out" render={<button type="submit" />}>
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function WorkspaceHeader() {
  const pathname = usePathname();
  const route = titleForPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold">{route.title}</p>
        <p className="hidden truncate text-xs text-muted-foreground lg:block">
          {route.description}
        </p>
      </div>
      <Badge variant="outline" className="hidden sm:inline-flex">
        {ACTIVE_CYCLE.status}
      </Badge>
      <NativeSelect
        aria-label="Active cycle"
        defaultValue={ACTIVE_CYCLE.id}
        className="hidden w-48 md:block"
      >
        <NativeSelectOption value={ACTIVE_CYCLE.id}>{ACTIVE_CYCLE.name}</NativeSelectOption>
      </NativeSelect>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <WorkspaceSidebar />
        <SidebarInset>
          <WorkspaceHeader />
          <div className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
