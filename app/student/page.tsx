import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function Student() {
  const session=await getCurrentUser();
  if(!session || session.role!=="STUDENT") redirect("/api/auth/direct?role=STUDENT");
  return <Portal role="Student" title="My academic workspace" subtitle="Track attendance, timetable, leave, examinations, notifications and reports." />;
}