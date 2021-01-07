/**
 * USDT入金信息类 一个用户对个订单
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("usdt_order", {
    usdt_order_id: {   // 订单编号
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
    },
    user_id: {   
      type: DataTypes.STRING,
      field: "user_id",
      comment: "用户id",
      references: { //引用user模型里的id属性，即在USDT表中添加user_id逻辑关联
        model: "user",
        key: "user_id"
      }
    },
    admin_id: {
      comment: "审批人id",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    admin_name: {
      comment: "审批人名字",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    usdt_order_num:{ // 入金usdt数量
      type: DataTypes.DOUBLE,
      allowNull: false      
    },
    usdt_order_submmit_time: { // 入金申请提交时间
      type: DataTypes.DATE(),
      allowNull: false
    },
    usdt_confirm_status: { // 审批状态(0:已提交，1:已通过，2：未通过，3:已取消)
      type: DataTypes.ENUM("0","1","2","3"),
      allowNull: false
    },
    usdt_confirm_time: { // 入金确认时间时间
      type: DataTypes.DATE(),
      allowNull: true,
    },
    usdt_confirm_address: { // 入金地址
      type: DataTypes.STRING,
      allowNull: false
    },
    usdt_order_image:{
      comment: "usdt订单图片地址",
      type: DataTypes.STRING,
      allowNull:false,
      defaultValue: ""
    },
    usdt_order_status_note: {
      comment: "usdt订单审核备注",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    is_delete:{ // 是否删除订单
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "false",
    }
  }, {
    underscored: true, //额外字段以下划线来分割
    // createdAt: "created_at",
    // updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "USDT入金信息类",
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