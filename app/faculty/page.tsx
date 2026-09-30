import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function Faculty(){
  const session=await getSession();
  if(!session || session.role!=="FACULTY") redirect("/");
  return <Portal role="Faculty" title="Today's lectures" subtitle="Your timetable drives attendance. Open the applicable lecture and mark the class in seconds." />;
}
