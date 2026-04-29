import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

const activeTaskStatuses = ["TODO", "IN_PROGRESS"] as const;

function getHeatLevel(activeTaskCount: number) {
  if (activeTaskCount >= 6) return "critical";
  if (activeTaskCount >= 3) return "high";
  if (activeTaskCount >= 1) return "normal";
  return "idle";
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const users = await db.user.findMany({
    where: {
      department: user.department
    },
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      department: true,
      _count: {
        select: {
          assignedTasks: {
            where: {
              status: {
                in: [...activeTaskStatuses]
              }
            }
          }
        }
      }
    }
  });

  const workload = users.map((item) => ({
    userId: item.id,
    name: item.name,
    email: item.email,
    avatarUrl: item.avatarUrl,
    department: item.department,
    activeTaskCount: item._count.assignedTasks,
    heatLevel: getHeatLevel(item._count.assignedTasks)
  }));

  return NextResponse.json({ workload });
}
