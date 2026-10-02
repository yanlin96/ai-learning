import type { QualityFinding } from "@/lib/audit-findings";

export type Wcag20Level = "A" | "AA";

export type Wcag20Reference = {
  criterion: string;
  title: string;
  level: Wcag20Level;
};

export type Wcag20AutomatedCheck = Wcag20Reference & {
  status: "issue-detected" | "no-issue-detected";
  findings: number;
};

export type Wcag20ComplexCheck = Wcag20Reference & {
  test: string;
  status: "manual-required";
};

export const WCAG20_AUTOMATED_CRITERIA: Wcag20Reference[] = [
  { criterion: "1.1.1", title: "Non-text Content", level: "A" },
  { criterion: "1.3.1", title: "Info and Relationships", level: "A" },
  { criterion: "2.4.4", title: "Link Purpose (In Context)", level: "A" },
  { criterion: "2.4.6", title: "Headings and Labels", level: "AA" },
  { criterion: "3.1.1", title: "Language of Page", level: "A" },
  { criterion: "3.3.2", title: "Labels or Instructions", level: "A" },
  { criterion: "4.1.2", title: "Name, Role, Value", level: "A" },
];

export const WCAG20_COMPLEX_CHECKS: Wcag20ComplexCheck[] = [
  {
    criterion: "1.4.3",
    title: "Contrast (Minimum)",
    level: "AA",
    status: "manual-required",
    test: "Measure text and control-state contrast against every rendered background, including hover, disabled and error states.",
  },
  {
    criterion: "2.1.1",
    title: "Keyboard",
    level: "A",
    status: "manual-required",
    test: "Complete each action using only Tab, Shift+Tab, Enter, Space and arrow keys; do not activate destructive controls during the review.",
  },
  {
    criterion: "2.1.2",
    title: "No Keyboard Trap",
    level: "A",
    status: "manual-required",
    test: "Enter menus, dialogs, embedded widgets and date pickers, then confirm keyboard focus can leave or the documented exit key works.",
  },
  {
    criterion: "2.4.3",
    title: "Focus Order",
    level: "A",
    status: "manual-required",
    test: "Tab through the page and confirm focus follows the visual and task order, including content revealed after an action.",
  },
  {
    criterion: "2.4.7",
    title: "Focus Visible",
    level: "AA",
    status: "manual-required",
    test: "Confirm every keyboard-focusable control has a clearly visible indicator on each background and in every component state.",
  },
  {
    criterion: "3.2.1 / 3.2.2",
    title: "Predictable Focus and Input",
    level: "A",
    status: "manual-required",
    test: "Check that focusing a control does not navigate, and that buttons, links and form changes produce the labelled, expected destination or state change.",
  },
];

export function buildWcag20AutomatedChecks(findings: QualityFinding[]): Wcag20AutomatedCheck[] {
  return WCAG20_AUTOMATED_CRITERIA.map((criterion) => {
    const count = findings.filter((finding) => finding.wcag?.some((reference) => reference.criterion === criterion.criterion)).length;
    return { ...criterion, status: count ? "issue-detected" : "no-issue-detected", findings: count };
  });
}
