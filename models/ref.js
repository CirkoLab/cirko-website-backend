/**
 * 模型关联类
 */
let { sequelize } = require("../config/db");

let User = sequelize.import("./user");   // 用户信息
let Wallet = sequelize.import("./wallet"); // 钱包信息
let ProfitBoard = sequelize.import("./profit_board"); // 推广信息表
let PromotionBoard = sequelize.import("./promotion_board"); // 每天收益信息表

let RewardOrder = sequelize.import("./reward_order"); // 提成信息
let BaseInfo = sequelize.import("./base_info"); // 配置信息

let usdtOrder = sequelize.import("./usdt_order");   // USDT入金信息
let spaceOrder = sequelize.import("./space_order"); // 空间置换信息

let Withdraw = sequelize.import("./withdraw");   // 提现收手续费配置

let usdt_release = sequelize.import("./usdt_release"); // usdt释放表
let user_relate = sequelize.import("./user_relate");   // 用户依赖关系表

let Role = sequelize.import("./role")
let Admin = sequelize.import("./admin")

const AlterWallet = sequelize.import("./alter_wallet")

const Explain = sequelize.import("./explain")  // 规则内容说明


const FreeOrder = sequelize.import("./free_order")
//同步:没有就新建,有就不变
// mining.sync();

User.hasMany(AlterWallet, {
  foreignKey: 'user_id', // oder表
  targetKey: 'user_id', // user表
})
AlterWallet.belongsTo(User, { foreignKey: 'user_id' }); //usdtOrder想反查user必须加这个，否则只能实现user查询usdtOrder

// 一个用户有多个USDT订单
User.hasMany(usdtOrder, {
  foreignKey: 'user_id', // oder表
  targetKey: 'user_id', // user表
});
usdtOrder.belongsTo(User, { foreignKey: 'user_id' }); //usdtOrder想反查user必须加这个，否则只能实现user查询usdtOrder

User.hasMany(spaceOrder, {
  foreignKey: 'user_id', // oder表
  sourceKey: 'user_id', // user表
});
spaceOrder.belongsTo(User, { foreignKey: 'user_id' }); //usdtOrder想反查user必须加这个，否则只能实现user查询usdtOrder

// // Admin.hasMany(Role, {
// //   foreignKey: 'id', // Role
// //   targetKey: 'role_id',  // Admin
// // });
// // Role.belongsTo(Admin);  // role have a admin_id

// 一个用户有一个钱包
User.hasOne(Wallet, {
  targetKey: 'user_id', // user表
  foreignKey: 'user_id', // Wallet表
});
Wallet.belongsTo(User);

// 一个用户有一条推广信息
User.hasOne(ProfitBoard, {
  sourceKey: 'user_id',
  foreignKey: 'user_id',
})
ProfitBoard.belongsTo(User);

// // 一个用户有一条天收益信息
User.hasOne(PromotionBoard, {
  sourceKey: 'user_id',
  foreignKey: 'user_id',
})
PromotionBoard.belongsTo(User);

// 用户有多个奖励订单
User.hasMany(RewardOrder, {
  sourceKey: 'user_id',
  foreignKey: 'reward_parent_user_id',
})
// reward_parent_user_id
RewardOrder.belongsTo(User, { foreignKey: 'reward_parent_user_id' });

// 奖励订单对应一个购买置换空间订单
RewardOrder.hasOne(spaceOrder, {
  sourceKey: 'reward_space_order_id',
  foreignKey: 'space_order_id',
})

/******** 用户关联提现订单 ********/
User.hasMany(UsdtWithdrawOrder, {
  sourceKey: 'user_id',
  foreignKey: 'user_id',
})
UsdtWithdrawOrder.belongsTo(User, { foreignKey: 'user_id' });


/******** 用户关联提现订单 end ********/


// Admin.hasMany(Role, {
//   foreignKey: 'id', // Role
//   targetKey: 'role_id',  // Admin
// });
//Role.belongsTo(Admin);  // role have a admin_id

//Role.sync({ alter: true})  // 修改开启