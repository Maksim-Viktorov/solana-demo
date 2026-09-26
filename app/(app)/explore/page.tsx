import { data } from "@/lib/data";
import { ExploreView, type ExploreItem } from "./explore-view";

export default async function ExplorePage() {
  const events = await data.listEvents();
  const items: ExploreItem[] = await Promise.all(
    events.map(async (event) => {
      const [creator, stakes] = await Promise.all([data.getUser(event.creator), data.getStakesForEvent(event.id)]);
      return {
        event,
        creatorName: creator?.displayName.split(" ")[0] ?? "Anon",
        // Designs show trust on a 0-5 scale.
        creatorTrust: (creator?.trust.bettor ?? 0) * 5,
        bettors: stakes.length,
      };
    }),
  );
  return <ExploreView items={items} />;
}
