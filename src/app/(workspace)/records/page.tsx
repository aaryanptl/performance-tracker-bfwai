import { ShieldCheck } from "lucide-react";
import { ExportActions } from "@/app/components/export-actions";
import { PageHeader } from "@/app/components/page-header";
import { ScopedPeopleTable } from "@/app/components/scoped-people-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RecordsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Scope-aware exports"
        title="Records & downloads"
        description="Download only the records visible to the selected role. Coaches receive their own team; administrators receive the organisation."
        action={<ExportActions />}
      />
      <Alert className="mb-6">
        <ShieldCheck />
        <AlertTitle>The same boundary applies on screen and in downloads</AlertTitle>
        <AlertDescription>
          Changing a URL or download type never expands the selected person's coaching scope.
        </AlertDescription>
      </Alert>
      <ScopedPeopleTable actionBase="/records" />
    </>
  );
}
