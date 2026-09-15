import { getLineDisruptions, SOURCE_URL } from "@/lib/disruptions";
import { getTrainLines } from "@/lib/train-lines";
import { TrainStatusSearch } from "@/app/train-status-search";
import { PageContent, PageHeading } from "@/app/page-template";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isOktaConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DisruptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ lineId?: string }>;
}) {
  if (!isOktaConfigured) redirect("/train-login");
  const session = await getServerSession(authOptions);
  if (!session) redirect("/train-login");

  let lines = [] as Awaited<ReturnType<typeof getTrainLines>>;
  try {
    lines = await getTrainLines();
  } catch {
    // The status card below explains that live train data is unavailable.
  }

  const requestedLineId = (await searchParams).lineId;
  const selectedLine = lines.find((line) => line.id === requestedLineId)
    ?? lines.find((line) => line.id === "werribee")
    ?? lines[0]
    ?? null;
  let disruptions = [] as Awaited<ReturnType<typeof getLineDisruptions>>;
  let unavailable = false;

  try {
    if (selectedLine) disruptions = await getLineDisruptions(selectedLine);
    else unavailable = true;
  } catch {
    unavailable = true;
  }

  return (
    <main>


      <PageContent>
        <PageHeading eyebrow="Melbourne train status" title={<>Find your line.<br/>Know before you <em>go.</em></>}
          description="Search any metropolitan train line and check the service changes, planned works, and station notices that could affect your trip."/>

        <TrainStatusSearch
          lines={lines}
          initialLine={selectedLine}
          initialDisruptions={disruptions}
          initialUnavailable={unavailable}
          checkedAt={new Date().toISOString()}
          sourceUrl={SOURCE_URL}
        />
      </PageContent>

    </main>
  );
}
