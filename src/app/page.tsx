import { redirect } from "next/navigation";
import { HomePageClient } from "@/components/home-page-client";
import { getHomePageData } from "@/lib/home-data";
import { isAdminAuthConfigured } from "@/lib/utils";

export const revalidate = 60;

export default async function Home() {
  if (!isAdminAuthConfigured()) {
    redirect("/init");
  }

  const homePageData = await getHomePageData();

  return (
    <HomePageClient
      initialLinks={homePageData.links}
      initialHasMore={homePageData.hasMore}
      initialRecommendedLinks={homePageData.recommendedLinks}
      initialTags={homePageData.randomTags}
    />
  );
}
