/**
 * 后台用户类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("admin", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false, //非空
      primaryKey: true, //主键
      autoIncrement: true, //自动递增
    },
    name: {
      comment:"姓名",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    /**职位id列表（1,2,3） */
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    /**登录用户名 */
    login_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    /**登录密码 */
    login_password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    // /**职位名称列表（开发,总经理） */
    // role_name: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    //   defaultValue: ''
    // },
    /**是否启用：0禁止访问 1正常*/
    is_enabled: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "1"
    },
    is_super:{
      /**是否启用：0 1超级权限*/
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    }
  }, {
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "用户信息类",
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