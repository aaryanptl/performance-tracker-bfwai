import { LibraryBrowser } from "@/app/components/library-browser";
import { PageHeader } from "@/app/components/page-header";
import { LIBRARY_COMPETENCIES, LIBRARY_OKRS } from "@/data/library";

export default function LibraryPage() {
  return (
    <>
      <PageHeader
        eyebrow={`${LIBRARY_OKRS.length} key results · ${LIBRARY_COMPETENCIES.length} competencies`}
        title="Goal & competency library"
        description="A starting menu, not a binding list. Example key results with the data source that measures them, and competencies with what a 5, a 3 and a 1 look like. Adapt the wording to your real work, and add your own."
      />
      <LibraryBrowser />
    </>
  );
}
