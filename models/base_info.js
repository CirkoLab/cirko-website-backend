/**
 * 基础信息表类
 * 单价usdt数 总体T 8数
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("base_info", {
    base_info_id: {
      // 递增id设置
      type: DataTypes.INTEGER,
      allowNull: false, //非空
      primaryKey: true, //主键
      autoIncrement: true, //自动递增
    },
    base_info_usdt_price: {
      comment:"usdt单价",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 330,
    },
    base_info_space_total: {
      comment: "置换多少T有优惠",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 8,
    },
    base_info_reward_ratio: {
      comment: "每有8T以上优惠比例",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0.1
    },
    base_info_rewrad_old_miner_num: {
      comment: "配置老矿工奖励数量比例",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0.19,
    },
    base_info_rewrad_new_miner_num: {
      comment: "配置新矿工奖励数量比例",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0.14,
    },
    base_info_reward_type: {
      comment: "配置奖励类型",
      type: DataTypes.STRING,
      allowNull: false, //非空，
      defaultValue: "usdt" // usdt
    },
    base_info_company_usdt_address:{
      comment: "充值订单的公司usdt地址",
      type: DataTypes.STRING,
      allowNull: false, //非空，
      defaultValue: "0xd8cc70675748b7f072baac8748aa7a162a9e86dc"
    },
    base_info_reward_order_space_limit: {
      comment: "每个用户获取奖励订单的自身空间条件",
      type: DataTypes.INTEGER,
      allowNull: false, //非空，
      defaultValue: 1
    }
  }, {
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    // classMethods: classMethods,
    comment: "单价表类",
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}
