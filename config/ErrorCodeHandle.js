// 错误码设置
class ErrorCode {

  constructor({ code, msg, err }) {
    this.err = err || true
    this.code = code || 500
    this.msg = msg || "服务器未知错误"
  }

}

module.exports = {
  ERR_SERVER: new ErrorCode({}),
  ERR_NOT_FOUND_USER: new ErrorCode({ code: 4001, msg: "找不到用户" }),
  ERR_CREATE_MARKET: new ErrorCode({ code: 6001, msg: "市场创建出现错误" }),
  ERR_EXEXIS_MARKET: new ErrorCode({ code: 6002, msg: "出现重复市场名字" }),
  ERR_FINDALl_MARKET: new ErrorCode({ code: 6003, msg: "查询所有市场出现错误" }),
  ERR_CREATE_MARKET_ALERT: new ErrorCode({ code: 6004, msg: "创建修改市场记录出现错误" }),
  ERR_UPDATE_MARKET_ALERT: new ErrorCode({ code: 6005, msg: "审核修改市场记录出现错误" }),
  ERR_NOT_FOUND_MARKET_ALERT: new ErrorCode({ code: 6006, msg: "找不到市场记录" }),
  ERR_NOT_FOUND_BASE_MARKET: new ErrorCode({ code: 6007, msg: "未配置base market基础信息" }),
  ERR_NOT_FOUND_MARKET: new ErrorCode({ code: 6008, msg: "数据库无该市场" }),
  ERR_USER_NOT_FOUND_MARKET: new ErrorCode({ code: 6009, msg: "该用户无市场团队" }),
  ERR_QUERY_USER_MARKET: new ErrorCode({ code: 6010, msg: "查询用户市场团队信息出错" }),
  ERR_QUERY_MARKET_RELATE: new ErrorCode({ code: 6011, msg: "查询市场团队关系出错" }),
  ERR_QUERY_MARKET_TEAM: new ErrorCode({ code: 6012, msg: "查询团队成员失败" }),
  ERR_NOT_AUTH_MARKET_TRANSFER: new ErrorCode({ code: 6013, msg: "对不起, 您无权限转账" }),
  ERR_VALIDATE_PHONE: new ErrorCode({ code: 6014, msg: "请检查手机号是否填写规范" }),
  ERR_VALIDATE_MARKET_ADDRESS: new ErrorCode({ code: 6015, msg: "请检查市场地址是否填写规范" }),

}

