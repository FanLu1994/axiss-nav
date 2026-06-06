import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "系统已切换为单管理员模式，不再提供注册能力",
    },
    { status: 410 }
  );
}
