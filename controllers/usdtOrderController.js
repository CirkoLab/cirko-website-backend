let { sequelize } = require("../config/db");

let UsdtOrder = sequelize.import("../models/usdt_order");   // USDT入金信息
let User = sequelize.import("../models/user");     // 用户信息
let Wallet = sequelize.import("../models/wallet");
const explain = sequelize.import("../models/explain")

const BaseInfo = sequelize.import("../models/base_info")
const OSS = require("../util/oss")
let ossSts = require("../util/ossSts")
const Cal = require("../util/calculate")
const config = require("../config/host")

const FreeOrder = sequelize.import("../models/free_order");
// POST 提交订单
exports.submitUsdtOrder = function (req, res) {
  let { user_id } = req.user
  let {
    usdt_order_num,
    usdt_confirm_address,
    usdt_order_image
  } = req.body
  User.findOne({ where: { user_id } }).then(user => {
    if (user) {

      // 充值usdt金额必须大于0或不为空
      if (!usdt_order_num || parseFloat(usdt_order_num) < 0) {
        return res.send({ err: true, msg: "充值usdt金额必须大于0或不为空" })
      }
      let usdt_order = new UsdtOrder({
        user_id,
        usdt_order_num,
        usdt_order_submmit_time: new Date().getTime(),
        usdt_confirm_status: "0",// 审批状态(0:已提交，1:已通过，2：未通过，3:已取消)
        usdt_order_image,  // 图片地址
        usdt_confirm_address: usdt_confirm_address || "入金地址未知",
      })

      usdt_order.save().then(order => {
        if (order) {
          res.send({ err: false, msg: "success" })
        }
      }).catch(err => {
        console.log("usdt_order not save", err)
        res.status(401).send({ err: true, msg: "usdt_order do not save", err_msg: err })
      })
    } else {
      res.status(401).send({ err: true, msg: "用户不存在" })
    }
  }).catch(err => {
    console.log("addUsdtOrder err", err)
    res.send({ err: true, msg: "addUsdtOrder err", err_msg: err })
  })
}

// OSS的sts
exports.getAliOssSts = function (req, res) {

  ossSts.getAliOssSts().then(result => {
    return res.send({ err: false, msg: "success", data: result })
  }).catch(err => {
    console.log("exports.getAliOssSts -> err", err)
    return res.send({ err: true, msg: "getAliOssSts fail" })
  })

}

// 上传图片
exports.uploadUstdImage = function (req, res) {

  if (req.file.length === 0) {  //判断一下文件是否存在，也可以在前端代码中进行判断。
    res.send({ err: true, msg: "上传文件不能为空！" })
    return
  } else {
    let file = req.file;
    let fileInfo = {};
    // fs.renameSync('./upload/' + file.filename, './upload/' + file.originalname);//这里修改文件名字，比较随意。
    fs.renameSync('./usdt_upload/' + file.filename, './usdt_upload/' + file.filename + ".png");//这里修改文件名字，比较随意。
    // 获取文件信息
    fileInfo.mimetype = file.mimetype;
    fileInfo.originalname = file.originalname;
    fileInfo.size = file.size;
    fileInfo.path = file.path;

    // // 设置响应类型及编码
    // res.set({
    //   'content-type': 'application/json; charset=utf-8'
    // });
    // let url = `http://${config.host}:${config.port}/${fileInfo.path}`
    let url = `http://server.imnebula.com/${fileInfo.path}.png`

    res.send({ err: false, data: { url }, msg: "success" });
  }
}

// GET 查询订单
exports.queryUsdtOrder = function (req, res) {
  let { usdt_order_id, phone_num } = req.query
  let where = {}
  console.log("exports.queryUsdtOrder -> req.query", req.query)

  if (usdt_order_id) {
    where.usdt_order_id = usdt_order_id
  } else if (phone_num) {
    where.phonenum = phone_num
  } else {
    where = {
      phone_num,
      usdt_order_id
    }
  }

  User.findAll({
    attributes: ["user_id"],    //  需要查询出的字段
    where: { phone_num },
    include: [{
      model: UsdtOrder,
    }],

  }).then(order => {
    res.send({ err: false, data: order })
  }).catch(err => {
    console.log("exports.queryUsdtOrder -> err", err)
  })
}

// GET 查询所有usdt订单并分页
exports.queryAllUsdtOrder = function (req, res) {
  let total = {
    usdt_order_num: 0,
  }

  switch (req.query.type) {
    case "0":
      let currentPage = parseInt(req.query.currentPage) || 1
      let pageSize = parseInt(req.query.pageSize) || 2

      UsdtOrder.findAndCountAll({
        order: [
          ['usdt_order_submmit_time', 'DESC'],
        ],
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,

      }).then(orders => {
        return res.json({ err: false, data: orders })
      }).catch(err => {
        console.log("exports.queryAllUsdtOrder -> err", err)
        return res.json({ err: true, msg: "exports.queryAllUsdtOrder", err_msg: err })
      })
      break;
    case "1":
      UsdtOrder.findAll({
        order: [
          ['usdt_order_submmit_time', 'DESC'],
        ],
        raw: true,
        include: [{
          model: User,
          attributes: ["user_name", "phone_num"],
        }],
      }).then(orders => {
        if (orders) {
          let list = orders.filter(item => { return item.usdt_confirm_status == "1" })
          list.forEach(ele => {
            total.usdt_order_num += ele.usdt_order_num
          });
          total.usdt_order_num = Cal.keepTwoDecimalFull(total.usdt_order_num)
          return res.json({ err: false, total, data: orders })
        }
      }).catch(err => {
        console.log("exports.queryAllUsdtOrder -> err", err)
        return res.json({ err: true, msg: "exports.queryAllUsdtOrder", err_msg: err })
      })
      break;
    default:
      return res.send({ err: false, msg: "type参数错误，type参数‘0’为分页,‘1’为全部数据" })
  }
}


// 审核usdt入金订单
// 事务回滚 审批状态(0:已提交，1:已通过，2：未通过，3:已取消)
exports.updateStatus = async function (req, res) {
  try {
    let { usdtOrderId, status, note } = req.body
    let { name: admin_name, user_id: admin_id } = req.user
    let { user_id, usdt_order_num, usdt_confirm_status } = await UsdtOrder.findOne({ where: { usdt_order_id: usdtOrderId } }) // 下单用户

    if (usdt_confirm_status == "1" || usdt_confirm_status == "2") {
      return res.send({ err: true, msg: "已经审核过该订单，请刷新一下" })
    }

    if (status == "1") {
      // 审核通过
      let result = await UsdtOrder.update(
        {
          admin_name,
          admin_id,
          usdt_confirm_status: status,
          usdt_order_status_note: note || "",
          usdt_confirm_time: new Date().getTime(),
        },
        {
          where: { usdt_order_id: usdtOrderId }
        }
      )

      let user_wallet = await Wallet.findOne({ where: { user_id } })

      // 用户的usdt钱包增加
      let user_wallet_update = await Wallet.update({
        usdt_balance: parseFloat(Cal.keepTwoDecimalFull(Cal.accAdd(parseFloat(user_wallet.usdt_balance), usdt_order_num))) // 小数相加
      }, { where: { user_id } })

      if (result && user_wallet_update) {
        return res.send({ err: false, msg: "审核成功" })
      } else {
        return res.send({ err: true, msg: "数据库更新失败" })
      }
    } else if (status == "2") {
      // 审核不通过
      let result = await UsdtOrder.update(
        {
          admin_name,
          admin_id,
          usdt_confirm_status: status,
          usdt_order_status_note: note || "",
          usdt_confirm_time: new Date().getTime(),
        },
        {
          where: { usdt_order_id: usdtOrderId }
        }
      )

      if (result) {
        return res.send({ err: false, msg: "审核成功" })
      } else {
        return res.send({ err: true, msg: "数据库更新失败" })
      }
    } else {
      return res.send({ err: true, msg: "status 参数错误" })
    }

  } catch (e) {
    console.log("error", e)
    return res.send({ err: true, msg: "数据库更新失败e", err_msg: e })
  }
}


// put 修改订单
exports.updateUsdtOrder = function (req, res) {
  let { usdt_order_id, usdt_order_num, usdt_confirm_address } = req.body
  UsdtOrder.update(
    {
      usdt_order_num,
      usdt_confirm_address,
    },
    {
      where: {
        usdt_order_id,
      },
    }).then((order) => {
      order && res.json({ err: false, msg: "success", order })
    }).catch(err => {
      err && res.json({ err: true, msg: "success" })
      console.log("exports.updateUsdtOrder -> err", err)
    })
}

// delete 删除订单
exports.deleteUsdtOrder = function (req, res) {
  let { usdt_order_id } = req.query
  UsdtOrder.update(
    {
      is_delete: "true"
    },
    {
      where: { usdt_order_id, }
    }
  ).then(reuslt => {
    res.json({ err: true, msg: "success" })
  }).catch(err => {
    console.log("exports.deleteUsdtOrder -> err", err)
    res.status(500).json({ err: false, msg: "exports.deleteUsdtOrder", err_msg: err })
  })
}

// 获取usdt单价 优惠比例 公司钱包地址
exports.queryBaseInfo = function (req, res) {
  if (req.user.role_name !== "admin") {
    console.log("alterCompanyAddress level-1", req.user)
    return res.send("该用户无权限查看")
  }
  BaseInfo.findAll().then(info => {
    if (info) {
      let data = [
        {
          title: "usdt_price",
          content: info[0].base_info_usdt_price,
          desc: "每算力价格（CNY）"
        },
        {
          title: "reward_ratio",
          content: info[0].base_info_reward_ratio,
          desc: "减免比例"
        },
        {
          title: "company_usdt_address",
          content: info[0].base_info_company_usdt_address,
          desc: "公司收款地址"
        },
        {
          title: "reward_order_space_limit",
          content: info[0].base_info_reward_order_space_limit,
          desc: "每个用户获取奖励订单的自身算力条件"
        },
        {
          title: "base_info_space_total",
          content: info[0].base_info_space_total,
          desc: "优惠算力价格界限"
        },
      ]
      return res.send({ err: false, msg: "success", data })
    } else {
      return res.send({ err: true, msg: "不存在base info table" })
    }
  }).catch(error => {
    console.log("exports.alterCompanyAddress -> error", error)
    return res.send({ err: true, msg: "服务器错误", error })
  })

}

// 获取usdt单价 优惠比例 公司钱包地址
exports.alterBaseInfo = function (req, res) {
  let { title, content } = req.body
  let obj = {}

  if (req.user.role_name !== "admin") {
    console.log("alterCompanyAddress level-1", req.user)
    return res.send({ err: true, msg: "该用户无权限修改" })
  }

  if (!title || !content) {
    return res.send({ err: true, msg: "title content 不为空" })
  }

  switch (title) {
    case "usdt_price":
      obj.base_info_usdt_price = content
      break;
    case "reward_ratio":
      obj.base_info_reward_ratio = content
      break;
    case "company_usdt_address":
      obj.base_info_company_usdt_address = content
      break;
    case "base_info_space_total":
      obj.base_info_space_total = content
      break;
    case "reward_order_space_limit":
      if (!(/(^[1-9]\d*$)/.test(content))) {
        return res.send({ err: true, msg: '必须输入整数' })
      }
      if (content < 1) {
        return res.send({ err: true, msg: '必须输入大于等于1T' })
      }
      obj.base_info_reward_order_space_limit = content
      break;
    default:
      return res.send({ err: true, msg: "该用户无权限修改" })
  }

  BaseInfo.update(obj, { where: { base_info_id: 1 } }).then(info => {
    if (info) {
      return res.send({ err: false, msg: "success", info })
    } else {
      return res.send({ err: true, msg: "修改失败", info })
    }
  }).catch(error => {
    console.log("exports.alterCompanyAddress -> error", error)
    return res.send({ err: true, msg: "服务器错误", error })
  })
}


