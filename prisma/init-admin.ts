async function initAdmin() {
  try {
    console.log("init-admin 已停用。");
    console.log("请改为在环境变量中配置唯一管理员账户：");
    console.log("ADMIN_USERNAME=admin");
    console.log("ADMIN_PASSWORD=your-password");
    console.log("JWT_SECRET=replace-with-a-long-random-secret");
  } catch (error) {
    console.error("读取管理员初始化说明失败:", error);
  }
}

initAdmin();
