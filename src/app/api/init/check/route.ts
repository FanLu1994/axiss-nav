import { NextResponse } from "next/server";
import { isAdminAuthConfigured } from "@/lib/utils";

export async function GET() {
  try {
    const isConfigured = isAdminAuthConfigured();

    return NextResponse.json({
      hasAdmin: isConfigured,
      needsInitialization: !isConfigured,
    });
  } catch (error) {
    console.error("检查管理员用户失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
