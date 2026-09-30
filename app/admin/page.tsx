import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Portal from "@/components/Portal";

export default async function Admin() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") redirect("/api/auth/direct?role=ADMIN");
  return <Portal role="Admin" title="College administration" subtitle="Manage departments, subjects, faculty, students, master timetable and system settings." />;
}
