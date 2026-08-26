import { Search } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { COMPETENCIES } from "@/data/performance";

export default function LibraryPage() {
  return (
    <>
      <PageHeader
        eyebrow={`${COMPETENCIES.length} expectations`}
        title="Competency library"
        description="Use the library to choose behaviours that match the role and to name evidence before the review begins."
        action={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search competencies"
              aria-label="Search competencies"
            />
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {COMPETENCIES.map((item) => (
          <Card key={item.name}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription className="mt-2">{item.description}</CardDescription>
                </div>
                <Badge variant="outline">{item.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Useful evidence
              </p>
              <p className="mt-2 text-sm leading-6">{item.evidence}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
