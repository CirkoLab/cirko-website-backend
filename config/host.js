// config.js
let config = {
  // 这是我们通过环境变量设置的
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 3001,
  //mysql_server: process.env.MYSQL_SERVER || "mysql://root:Dev2020!@localhost:3306/fast_app"  // 本地开发数据库
  //mysql_server:  "mysql://dev:fast888!@rm-uf63n219szj0l63a0mo.mysql.rds.aliyuncs.com:3306/fast_app" // 测试数据库
  mysql_server:  "mysql://sh-cynosdbmysql-grp-lecehv4q.sql.tencentcdb.com:28031/cirko_owner"
  // mysql_server: process.env.MYSQL_SERVER || "mysql://nebula:NEBULA8888!@rm-wz9ff13088j7dmhqreo.mysql.rds.aliyuncs.com:3306/nebula_app"  // 生产数据库

}

module.exports = config