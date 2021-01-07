/**
 * 首页文章类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("article", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false, //非空
      primaryKey: true, //主键
      autoIncrement: true, //自动递增
    },
    title: {
      comment: "标题",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    content:{
      comment: "文章内容",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    is_delete:{
      comment: "是否删除 0-否 1-删除",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    }
  }, {
    comment: "首页文章类",
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