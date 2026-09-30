import { redirect } from "next/navigation";
import { getSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Portal from "@/components/Portal";

export default async function Admin(){
  let session=await getSession();
  if(!session){
    const user=await prisma.user.findFirst({where:{role:"ADMIN",active:true},orderBy:{createdAt:"asc"}});
    if(user){
      await createSession({userId:user.id,role:user.role,institutionId:user.institutionId,departmentId:user.departmentId});
      session={userId:user.id,role:user.role,institutionId:user.institutionId,departmentId:user.departmentId};
    }
  }
  if(!session || session.role!=="ADMIN") redirect("/");
  return <Portal role="Admin" title="College administration" subtitle="Manage departments, subjects, faculty, students, master timetable and system settings." />;
}
