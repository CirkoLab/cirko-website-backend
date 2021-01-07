/**
 * 市场创建表
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("market", {
    market_id: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
      // type: DataTypes.INTEGER,
      // allowNull: false, //非空
      // primaryKey: true, //主键
      // autoIncrement: true, //自动递增
    },
    market_account:{
      comment: "市场账号",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    market_type: {
      comment: "市场类型 总公司-0 子公司-1 营业部-2",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0",
    },
    // market_team_id:{
    //   comment: "市场团队成员ID",
    //   type: DataTypes.STRING,
    //   allowNull: false,
    //   defaultValue: "",
    // },
    market_name: {
      comment: "市场架构名称",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    market_manger: {
      comment: "市场负责人姓名",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0",
    },
    market_phone: {
      comment: "市场负责人手机号码",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    market_address: {
      comment: "市场架构办公地址",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    is_closed:{
      comment: "市场架构状态是否关闭 默认不关闭-0 关闭-1",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0",
    },
    market_wallet_usdt:{
      comment: "市场钱包usdt",
      type: DataTypes.DOUBLE,
      allowNull:false,
      defaultValue:0
    },
    market_wallet_fil:{
      comment: "市场钱包fil",
      type: DataTypes.DOUBLE,
      allowNull:false,
      defaultValue:0
    },
    market_wallet_lamb:{
      comment: "市场钱包lamb",
      type: DataTypes.DOUBLE,
      allowNull:false,
      defaultValue:0
    },
    market_reward_space_num:{
      comment: "市场奖励空间",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
  }, {
    comment: "市场表",
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}

//静态方法
const classMethods = {
  //根据id查询
  getUserById: function (id) {
    return this.findById(id);
  },
  //获取所有
  getUsers: function (options) {
    return this.findAll(options);
  },
  //根据id更新数据
  updateUserById: function (values, id) {
    return this.update(values, {
      where: {
        id: id
      }
    });
  },
  //根据id删除数据
  deleteById: function (id) {
    return this.destroy({
      where: {
        id: id
      }
    })
  }
}