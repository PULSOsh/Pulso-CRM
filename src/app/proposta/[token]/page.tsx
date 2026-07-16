import { PublicProposal } from "@/components/proposals/public-proposal";

export default async function ProposalPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicProposal token={token} />;
}
