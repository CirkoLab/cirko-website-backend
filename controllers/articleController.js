const { sequelize } = require("../config/db");
const Article = sequelize.import("../models/article");

exports.getAricleList = function(req,res){
  Article.findAll({
    order:[
      ["created_at", "DESC"]
    ],
    where: {
      is_delete:"0"  // 未删除的文章
    }
  }).then(result => {
    if (result){
      return res.send({ err: false, msg: "success", data: result })
    }
  }).catch(err => {
    console.log("exports.getAricleList -> err", err)
    return 
  });
}