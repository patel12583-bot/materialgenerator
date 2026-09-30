import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function Admin(){
  const session=await getSession();
  if(!session || session.role!=="ADMIN") redirect("/login");
  return <Portal role="Admin" title="College administration" subtitle="Manage departments, subjects, faculty, students, master timetable and system settings."/>;
}
