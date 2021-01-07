let { sequelize } = require("../config/db");
const User = sequelize.import("../models/user");     // 用户信息
let RewardOrder = sequelize.import("../models/reward_order");
let ProfitBoard = sequelize.import("../models/profit_board"); // 推广信息表
let PromotionBoard = sequelize.import("../models/promotion_board"); // 每天收益信息表
let SpaceOrder = sequelize.import("../models/space_order");
let UsdtOrder = sequelize.import("../models/usdt_order");   // USDT入金信息
let Wallet = sequelize.import("../models/wallet");
const UserRelate = sequelize.import("../models/user_relate")


// 推广记录 奖励审核通过才有记录
exports.getPromotion = async function (req, res) {
  try {
    let rewards = await RewardOrder.findAndCountAll({
      where: { reward_parent_user_id: req.user.user_id, reward_order_status: "1" },
      attributes: [],
      raw:true,
      include: [
        {
          model: SpaceOrder,
          attributes: ["space_order_id", "user_id", "usdt_order_confirm_time", "space_num", "space_price", "space_order_submmit_time","space_order_money_total"],
          order: [
            ['space_order_submmit_time', 'DESC']
          ],
          raw: true,
          include: [
            {
              model: User,
              attributes: ["user_id", "user_name", "phone_num"],
            }
          ]
        }
      ]
    })

    let usdtRows = rewards.rows  // 奖励单数组
    let people = await UserRelate.count({ where: { user_father_id: req.user.user_id } }) // 推广人数
    let people_space = 0        // 推广T数 名下会员的余额总T数
    let usdt_reward_sum = 0     // 推广奖励
    let order_list = []         // 推广订单数
    /*
    for (let i = 0; i < usdtRows.length; i++) {
      // let order = await User.findOne({
      //   attributes: ['user_id','user_name', "phone_num"],
      //   raw: true,
      //   include: [
      //     {
      //       model: SpaceOrder,
      //       where: { space_order_id: usdtRows[i].reward_space_order_id },
      //       order:[
      //         ['space_order_submmit_time', 'DESC']
      //       ],
      //     },
      //     // {
      //     //     model:Wallet,
      //     // },
      //   ]
      // }) 
      // order_list.push(order)
      if (usdtRows[i].reward_num){
        usdt_reward_sum += usdtRows[i].reward_num
      }
    }
      */

    /* 改奖励订单start*/
    let rewardList = await RewardOrder.findAll({
      where: { reward_parent_user_id: req.user.user_id, reward_order_status: "1" },
    })

    if (rewardList){
      rewardList.forEach(element => {
        usdt_reward_sum += element.reward_num
      });
    }
    /* end*/
    
    // 计算推广空间
    let user_list = await User.findAll({
      where: {
        parent_code: req.user.invite_code
      },
      include: [
        { model: Wallet }
      ]
    })
    for (let i = 0; i < user_list.length; i++) {
      people_space += user_list[i].wallet.user_space_num
    }
    console.log("rewards", rewards)
    res.send({ err: false, msg: "success", data: { people, usdt_reward_sum, people_space, order_list: rewards.rows } })

  } catch (err) {
    console.log("exports.getPromotion -> err", err)
    res.send({ err: true, msg: "exports getPromotion err", err_msg: err })
  }
}

// 我的奖励明细
exports.getRewardOrderList = function (req, res) {
  RewardOrder.findAll({
    order:[
      ['created_at','DESC']
    ],
    attributes: ["reward_num", "reward_order_status", "reward_order_status_note","created_at"],
    raw:true,
    include: [
      {
        model: SpaceOrder,
        attributes: ["space_num", "space_order_submmit_time"],
        include:[
          {
            model: User,
            attributes: ["user_id", "user_name", "phone_num"],
          },
        ]
      }
    ],
    where: { reward_parent_user_id: req.user.user_id }
  }).then(rewards => {
    let data = rewards.filter(item => item.reward_num !== 0)
    // data.sort((a, b) => new Date(b["created_at"]).getTime() - new Date(a['created_at']).getTime())
    res.send({ err: false, msg: "success", data })
  }).catch(err => {
    res.send({ err: true, msg: "exports getPromotion err", err_msg: err })
    console.log("exports.getPromotion -> err", err)
  })
  // User.findAll(
  //   {
  //     attributes: ["user_id", "user_name", "user_name", "phone_num",],
  //     include: [
  //       {
  //         model: RewardOrder,
  //         where: { reward_parent_user_id: req.user.user_id },
  //         attributes: ["reward_num", "reward_order_status", "reward_order_status_note"],
  //         include: [
  //           {
  //             model: SpaceOrder,
  //             attributes: ["space_num", "space_order_submmit_time"]
  //           }
  //         ]
  //       }
  //     ]
  //   }
  // ).then(result => {
  //   if (result) {
  //     return res.send({ err: false, msg: "success", data: result })
  //   }
  // }).catch(err => {
  //   console.log("exports.getRewardOrderList -> err", err)
  //   return res.send({ err: true, msg: "reward order list fail", })
  // })
}

// 我的充值记录 usdt入金
exports.getUsdtOrder = function (req, res) {
  User.findAll({
    attributes: ["user_id", "user_name", "phone_num",],    //  需要查询出的字段
    include: [{
      order: [
        ['usdt_order_submmit_time', 'DESC']
      ],
      model: UsdtOrder,
      where: { user_id: req.user.user_id },
      attributes: ["usdt_order_id", "usdt_order_num", "usdt_order_submmit_time", "usdt_confirm_status", "usdt_confirm_address", "usdt_order_status_note"],    //  需要查询出的字段
    }],

  }).then(orders => {
    let data =[]
    if (orders[0]) {
      data = orders[0].usdt_orders.sort((a, b) => new Date(b.usdt_order_submmit_time).getTime() - new Date(a.usdt_order_submmit_time).getTime())
      return res.send({ err: false, msg: "success", data })
    }
    data.sort((a, b) => new Date(b.usdt_order_submmit_time).getTime() - new Date(a.usdt_order_submmit_time).getTime())
    return res.send({ err: false, msg: "success", data })

  }).catch(err => {
    console.log("my usdt list error exports.queryUsdtOrder -> err", err)
    res.send({ err: false, msg: "my usdt list error" })
  })
}

// 我的会员
exports.getMymember = function (req, res) {

  function fn(data, parent_code) {
    let result = [], temp = []
    for (let i in data) {
      if (data[i].parent_code == parent_code) {
        result.push(data[i])
        temp = fn(data, data[i].invite_code)
        if (temp.length > 0) {
          data[i].dataValues.children = temp   // 不知道为什么数据库里的数据使用有dataValues属性    
        }
      }
    }
    return result
  }

  // function traverseTree2(node) {
  //   if (!node) {
  //     return;
  //   }
  //   var stack = [];
  //   stack.push(node);
  //   var tmpNode;
  //   while (stack.length > 0) {
  //     tmpNode = stack.pop();
  //     traverseNode2(tmpNode);
  //     if (tmpNode.children && tmpNode.children.length > 0) {
  //       var i = tmpNode.children.length - 1;
  //       for (i = tmpNode.children.length - 1; i >= 0; i--) {
  //         stack.push(tmpNode.children[i]);
  //       }
  //     }
  //   }
  // }
  // traverseTree2(root);

  User.findAll({
    attributes: ["user_id", "user_name", "phone_num", "parent_code", "invite_code", "created_at"],    //  需要查询出的字段
    // where: { parent_code: req.user.invite_code },
    include: [
      {
        model: Wallet,
        attributes: ["user_space_num"],    //  需要查询出的字段
      },
    ],
    order: [
      ['created_at', 'DESC']
    ]
  }).then(user => {
    // let list = JSON.parse(JSON.stringify(user))
    let arr = user.filter(item => item.parent_code == req.user.invite_code)

    // let tree = fn(user, req.user.parent_code)
    // let sum = sumSpace(tree)
    // let target = tree.find(item => { return item.user_id==req.user.user_id})
    res.send({ err: false, msg: "success", data: arr })
  }).catch(err => {
    console.log("exports.queryUsdtOrder -> err", err)
  })

}