/**
 * 赠送订单
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("free_order", {
    free_order_id: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
    },
    user_id: {
      comment: "用户ID",
      type: DataTypes.STRING,
      allowNull: false
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
    free_order_price_total:{
      comment: "赠送订单总价格",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    free_order_num: {
      comment: "赠送数量",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    free_order_type: {
      comment: "赠送订单类型 0-赠送空间",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValueL: "0"
    },
    free_order_number: {
      comment: "赠送订单合同号",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValueL: ""
    },
    free_order_note: {
      comment: "备注",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValueL: ""
    },
    created:{
      comment: "赠送订单类型 0-赠送空间",
      type: DataTypes.DATE()
    }
  }, {
    comment: "赠送订单",
    underscored: true, //额外字段以下划线来分割
    // createdAt: "created_at",
    // updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}