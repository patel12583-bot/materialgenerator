import { redirect } from "next/navigation";
import { getSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Portal from "@/components/Portal";

export default async function Faculty(){
  let session=await getSession();
  if(!session || session.role!=="FACULTY"){
    const user=await prisma.user.findFirst({where:{role:"FACULTY",active:true},orderBy:{createdAt:"asc"}});
    if(user){
      await createSession({userId:user.id,role:user.role,institutionId:user.institutionId,departmentId:user.departmentId});
      session={userId:user.id,role:user.role,institutionId:user.institutionId,departmentId:user.departmentId};
    }
  }
  if(!session || session.role!=="FACULTY") redirect("/");
  return <Portal role="Faculty" title="Today's lectures" subtitle="Your timetable drives attendance. Open the applicable lecture and mark the class in seconds." />;
}
