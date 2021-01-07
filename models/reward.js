/**
 * 提成信息类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("reward", {
    usdt_reward_order_id: {  //usdt提成编号
      type: DataTypes.INTEGER,
      allowNull: false, //非空
      autoIncrement: true, //自动递增
      primaryKey: true //主键
    },
    user_id:{  // 释放用户编号
      type: DataTypes.INTEGER,
      allowNull: false      
    },
    space_order_id:{ // 置换空间订单编号
      type: DataTypes.INTEGER,
      allowNull: false      
    },
    usdt_reward_num:{ // usdt提成数量
      type: DataTypes.DOUBLE,  
      allowNull: false      
    },
    usdt_reward_time:{ // usdt提成时间
      type: DataTypes.DATE(),  
      allowNull: false      
    },
    
  }, {
    underscored: true, //额外字段以下划线来分割
    // createdAt: "created_at",
    // updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "用户依赖关系类",
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