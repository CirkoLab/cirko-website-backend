// 生产环境数据库
module.exports = {
    'dialect': 'mysql',
    'host': 'rm-uf63n219szj0l63a0mo.mysql.rds.aliyuncs.com',
    "port": '3306',
    'database': 'fast_app',
    'username': 'fast',
    'password': 'fast8888!',
    'secret': 'nodeauthsecret',
    'DevMysqServerl':"mysql://dev:Omni2020!@rm-uf63n219szj0l63a0mo.mysql.rds.aliyuncs.com:3306/fast_app",
    'TestMysqlServer':"mysql://fast:fast8888!@rm-wz9ff13088j7dmhqreo.mysql.rds.aliyuncs.com:3306/fast_app",
    "RedisServer": {
        "host": "127.0.0.1",
        "port": "6379",
        // "password":"1234"
    }
};