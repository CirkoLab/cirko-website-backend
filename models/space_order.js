/**
 * 空间置换信息
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("space_order", {
    space_order_id: {  
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
    },
    user_id:{ 
      type: DataTypes.STRING,
      allowNull: false      
    },
    usdt_order_confirm_time:{ 
      comment:"置换确认时间",
      type: DataTypes.DATE(),
    },
    space_num: { 
      comment:"置换空间数量",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    space_price:{
      comment:"置换空间单价",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    space_order_submmit_time:{
      comment:"置换申请提交时间",
      type: DataTypes.DATE(),
      allowNull: false
    },
    space_order_number:{
      comment:"置换空间订单号",
      type:DataTypes.STRING,
      allowNull: false
    },
    space_order_money_total:{
      comment: "置换空间订单总价",
      type: DataTypes.DOUBLE,
    },
    space_order_note:{
      comment: "置换空间备注",
      type: DataTypes.STRING,
      defaultValue:""
    }
    // space_confirm_status:{  // 审批状态(0:已提交，1:已通过，2：未通过，3:已取消) 
    //   type: DataTypes.STRING, 
    //   defaultValue:"1",
    //   allowNull: false
    // },
  }, {
    underscored: true, //额外字段以下划线来分割
    // createdAt: "created_at",
    // updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "空间置换信息",
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