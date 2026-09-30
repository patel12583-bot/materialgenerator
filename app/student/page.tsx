import { redirect } from "next/navigation";
import { getSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Portal from "@/components/Portal";

export default async function Student(){
  let session=await getSession();
  if(!session){
    const user=await prisma.user.findFirst({where:{role:"STUDENT",active:true},orderBy:{createdAt:"asc"}});
    if(user){
      await createSession({userId:user.id,role:user.role,institutionId:user.institutionId,departmentId:user.departmentId});
      session={userId:user.id,role:user.role,institutionId:user.institutionId,departmentId:user.departmentId};
    }
  }
  if(!session || session.role!=="STUDENT") redirect("/");
  return <Portal role="Student" title="My attendance" subtitle="Track subject-wise attendance, timetable, leave requests and eligibility alerts." />;
}
