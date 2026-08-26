import { RoleGate } from "@/app/components/role-gate";

export default function RecordsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate roles={["coach", "admin"]}>{children}</RoleGate>;
}
