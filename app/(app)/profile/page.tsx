import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/session";

export default async function MyProfilePage() {
  const viewer = await getViewer();
  redirect(viewer ? `/profile/${viewer.wallet}` : "/onboarding");
}
