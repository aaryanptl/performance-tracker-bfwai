import { RoleGate } from "@/app/components/role-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate roles={["admin"]}>{children}</RoleGate>;
}
