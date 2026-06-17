import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log("开始清理数据库...");

    // 删除所有链接
    const deletedLinks = await prisma.link.deleteMany();
    console.log(`删除了 ${deletedLinks.count} 个链接`);

    console.log("数据库清理完成！");
    console.log("注意：管理员账户由环境变量提供，不在数据库内清理");
  } catch (error) {
    console.error("清理数据库失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
