import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "系统已切换为环境变量管理员模式，请配置 ADMIN_USERNAME、ADMIN_PASSWORD、JWT_SECRET",
    },
    { status: 410 }
  );
}
