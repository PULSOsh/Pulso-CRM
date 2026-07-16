import { PublicBriefingForm } from "@/components/briefings/public-briefing-form";

export default async function PublicBriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicBriefingForm slug={slug} />;
}
