import { NextRequest, NextResponse } from "next/server";
import { getAdminProfile, verifyToken } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未提供有效的认证令牌" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "无效的认证令牌" }, { status: 401 });
    }

    const admin = getAdminProfile();
    if (decoded.userId !== admin.id || decoded.username !== admin.username) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("获取用户信息错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
