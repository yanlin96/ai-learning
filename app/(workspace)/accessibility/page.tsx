import { CheckCircle2, Hand } from "lucide-react";
import { AccessibilityForm } from "@/app/accessibility-form";
import { PageContent, PageHeading } from "@/app/page-template";

export default function AccessibilityPage() {
  return <main><PageContent><PageHeading title="Accessibility estimate" description="Check one public page for detectable accessibility barriers, then separate automated evidence from the testing that still needs a human." actions={<><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="text-teal-600" size={15}/> Automated DOM checks</span><span className="inline-flex items-center gap-1.5"><Hand className="text-amber-700" size={15}/> Manual testing stays visible</span></>}/><AccessibilityForm/></PageContent></main>;
}
