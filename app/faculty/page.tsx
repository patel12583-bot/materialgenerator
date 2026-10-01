import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function Faculty() {
  const session=await getCurrentUser();
  if(!session || session.role!=="FACULTY") redirect("/api/auth/direct?role=FACULTY");
  return <Portal role="Faculty" title="Faculty workspace" subtitle="Start today's lectures, record attendance and review your academic workload." />;
}
