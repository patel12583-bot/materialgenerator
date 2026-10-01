import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function Parent(){
  const session=await getCurrentUser();
  if(!session || session.role!=="PARENT") redirect("/api/auth/direct?role=PARENT");
  return <Portal role="Parent" title="Family academic overview" subtitle="Stay connected with attendance, leave status, notifications and reports." />;
}
