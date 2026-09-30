import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function Student(){
  const session=await getSession();
  if(!session || session.role!=="STUDENT") redirect("/");
  return <Portal role="Student" title="My attendance" subtitle="Track subject-wise attendance, timetable, leave requests and eligibility alerts." />;
}
