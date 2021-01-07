const { sequelize } = require("../../config/db");
const Explain = sequelize.import("../../models/explain");
const BaseInfo = sequelize.import("../../models/base_info");
const ErrorCodeHandle = require("../../config/ErrorCodeHandle")

// POST 上传规则说明
// type 规则说明类型 0-充值申请规则 1-优惠说明
exports.create = async function (req, res) {
  let { type, content } = req.body
  try {
    await Explain.create({
      type,
      content,
    })
  } catch (err) {
    console.log("exports.create -> err", err)
    return res.send(ErrorCodeHandle.ERR_SERVER)
  }
}

exports.getExplainList = async function (req, res) {
  try {
    let explain_list = await Explain.findAll()
    let base_info_list = await BaseInfo.findAll()

    if (explain_list && base_info_list) {
      let company_usdt_address = base_info_list[0].base_info_company_usdt_address

      return res.send({ err: false, msg: "success", data: { company_usdt_address, explain_list } })
    }else{
      return res.send({ err: true, msg: "数据库未设置数据", data: { company_usdt_address: company_usdt_address||"", explain_list:[] } })
    }
  } catch (error) {
    console.log("exports.getExplainList -> error", error)
    return res.send({ err: true, msg: "getExplainList server fail", error })
  }
}