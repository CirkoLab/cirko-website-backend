// ecosystem.config.js
module.exports = {
  apps: [
    {
      // 测试环境
      name: "test-implant",
      script: "./bin/www",
      error_file: "./logs/app-err.log",         // 错误日志文件
      out_file: "./logs/app-out.log",           // 正常日志文件
      merge_logs: true,                         // 设置追加日志而不是新建日志
      log_date_format: "YYYY-MM-DD HH:mm:ss",   // 指定日志文件的时间格式
      ignore_watch: [                           // 不用监听的文件
        "node_modules",
        "public"
      ],
      env: {
        "NODE_ENV": "test",
        "MYSQL_SERVER": "mysql://fast:fast888!@rm-uf63n219szj0l63a0mo.mysql.rds.aliyuncs.com:3306/fast_app",
        "HOST": "120.76.142.148",
        "PORT": 8989
      }
    },
    {
      // 生产环境
      name: "prod-implant",
      script: "./bin/www",
      error_file: "./logs/app-err.log",         // 错误日志文件
      out_file: "./logs/app-out.log",           // 正常日志文件
      merge_logs: true,                         // 设置追加日志而不是新建日志
      log_date_format: "YYYY-MM-DD HH:mm:ss",   // 指定日志文件的时间格式
      ignore_watch: [                           // 不用监听的文件
        "node_modules",
        "public"
      ],
      env: {
        "NODE_ENV": "production",
        "MYSQL_SERVER": "mysql://darasakor:darasakor!123@rm-2vc069omyz0d8ztu968730fm.mysql.cn-chengdu.rds.aliyuncs.com:3306/darasakor_online",
        "HOST": "8.210.217.150",
        "PORT": 3000,
      }
    },
  ]
}