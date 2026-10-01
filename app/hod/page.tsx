import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function HOD(){
  const session=await getCurrentUser();
  if(!session || session.role!=="HOD") redirect("/api/auth/direct?role=HOD");
  return <Portal role="HOD" title="Department command centre" subtitle="Monitor faculty, students, attendance, leave and department performance." />;
}
