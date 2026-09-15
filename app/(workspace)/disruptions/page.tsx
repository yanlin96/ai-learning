import { getLineDisruptions, SOURCE_URL } from "@/lib/disruptions";
import { getTrainLines } from "@/lib/train-lines";
import { TrainStatusSearch } from "@/app/train-status-search";
import { TrainAccount } from "@/app/train-auth-controls";
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


      <section className="hero shell" id="top">
        <TrainAccount name={session.user?.name} email={session.user?.email} />
        <div className="eyebrow">MELBOURNE TRAIN STATUS</div>
        <h1>Find your line.<br />Know before you <em>go.</em></h1>
        <p className="intro">Search any metropolitan train line and check the service changes, planned works, and station notices that could affect your trip.</p>

        <TrainStatusSearch
          lines={lines}
          initialLine={selectedLine}
          initialDisruptions={disruptions}
          initialUnavailable={unavailable}
          checkedAt={new Date().toISOString()}
          sourceUrl={SOURCE_URL}
        />
      </section>

    </main>
  );
}
