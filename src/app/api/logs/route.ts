import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const type = url.searchParams.get("type") || "All";
    const actor = url.searchParams.get("actor") || "";
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "10");

    const where: any = {};
    if (search) {
      where.message = { contains: search };
    }
    if (type && type !== "All") {
      where.type = type;
    }
    if (actor) {
      // filter by performedBy partial match
      where.performedBy = { contains: actor };
    }

    const total = await (prisma as any).log.count({ where });
    const totalPages = Math.ceil(total / limit);

    const logs = await (prisma as any).log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ logs, total, totalPages, page }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    // If the `log` table doesn't exist yet (P2021), return an empty page instead of failing the frontend.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      console.warn("GET /api/logs: log table is missing (P2021); returning empty logs.");
      return NextResponse.json({ logs: [], total: 0, totalPages: 0, page: 1 }, { status: 200 });
    }
    console.error("GET /api/logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
