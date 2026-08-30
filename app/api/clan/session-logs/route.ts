import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { listSessionLogs } from "@/app/lib/clan-run/service";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listSessionLogs(userId);
    const logs = rows.map((row) => ({
      id: row.id,
      runId: row.runId,
      promptPreview: row.promptPreview,
      phase: row.phase,
      repositoryDisplay: row.repositoryDisplay,
      prUrl: row.prUrl,
      archivedAt: row.archivedAt.toISOString(),
      activity: row.activity,
    }));
    return NextResponse.json({ logs });
  } catch (error) {
    return controlPlaneInternalError("clan-run", "session-logs", error);
  }
}
