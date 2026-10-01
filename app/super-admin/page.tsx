import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function SuperAdmin(){
  const session=await getCurrentUser();
  if(!session || session.role!=="SUPER_ADMIN") redirect("/api/auth/direct?role=SUPER_ADMIN");
  return <Portal role="Super Admin" title="Institution control centre" subtitle="Manage platform governance, administrators, security and institutional operations." />;
}
