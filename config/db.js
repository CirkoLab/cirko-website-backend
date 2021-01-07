const Sequelize = require('sequelize');

let sequelize
let config = require("./host.js")

// 不同环境设置不同配置
switch (process.env.NODE_ENV) {
  case 'test':
    console.log('测试环境')
    break;
  case 'prod':
    console.log('生产环境')
    break;
  // 本地
  default:
    console.log('开发环境')
    console.log("数据库地址", config.mysql_server.split("@")[1])
}

sequelize = new Sequelize(config.mysql_server, {
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  timezone: '+08:00'  //  解决时差 - 默认存储时间存在8小时误差
})

//测试数据库链接
sequelize.authenticate().then(function () {
  console.log("数据库连接成功");
}).catch(function (err) {
  //数据库连接失败时打印输出
  throw err;
});

// sequelize.sync({ alter: true })

exports.sequelize = sequelize;
exports.Sequelize = Sequelize;
