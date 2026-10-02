import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documentId = request.nextUrl.searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "Document ID is required." }, { status: 400 });

  const document = await prisma.studentDocument.findUnique({
    where: { id: documentId },
    include: {
      student: {
        include: {
          user: { select: { id: true } },
          division: {
            include: {
              semester: {
                include: {
                  program: { include: { department: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!document || !document.fileUrl) return new NextResponse("Document not found", { status: 404 });

  const department = document.student.division.semester.program.department;
  const isStaff = ["ADMIN", "SUPER_ADMIN", "HOD", "FACULTY"].includes(session.role);
  const ownsDocument = session.role === "STUDENT" && document.student.userId === session.userId;

  if (!isStaff && !ownsDocument) return new NextResponse("Forbidden", { status: 403 });
  if (department.institutionId !== session.institutionId) return new NextResponse("Forbidden", { status: 403 });

  try {
    const result = await get(document.fileUrl, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) return new NextResponse("Document not found", { status: 404 });

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Disposition": result.blob.contentDisposition || `inline; filename="${document.name.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("student document delivery error", error);
    return new NextResponse("Unable to retrieve document", { status: 503 });
  }
}
