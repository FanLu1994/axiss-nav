import { NextRequest, NextResponse } from "next/server";
import { generateToken, getAdminProfile, verifyAdminCredentials } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 验证输入
    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码都是必填项" }, { status: 400 });
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const admin = getAdminProfile();

    const token = generateToken({
      userId: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    });

    return NextResponse.json({
      message: "登录成功",
      user: admin,
      token,
    });
  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
