import { CheckCircle2, Hand } from "lucide-react";
import { AccessibilityForm } from "@/app/accessibility-form";
import { PageContent, PageHeading } from "@/app/page-template";

export default function AccessibilityPage() {
  return <main><PageContent><PageHeading title="WCAG 2.0 AA estimate" description="Check one public page against a documented subset of WCAG 2.0, with simple automated evidence separated from complex interaction checks." actions={<><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="text-teal-600" size={15}/> Criteria-mapped DOM checks</span><span className="inline-flex items-center gap-1.5"><Hand className="text-amber-700" size={15}/> Interaction checks stay visible</span></>}/><AccessibilityForm/></PageContent></main>;
}
