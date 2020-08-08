const orders = require("../models/orders");

module.exports = {

  list:function(req, res){
    products.find({}).exec(function(err, pro){
      if(err){
        console.log(err);
        res.send(500, {error: 'Database Error'});
      }
      res.view('list', {prod:pro});
    });
  },

  add:function(req, res){
    res.view('add');
  },

  create: function(req, res){

    var product_name = req.body.product_name;
    var product_id = req.body.product_id;
    var qoh = req.body.qoh;
    var product_price = req.body.product_price;
    var product_url = req.body.product_url;
    var seller_id = 1998;

    console.log(product_name,product_id,qoh);

    products.find({product_id: product_id, product_name:product_name}).exec(function(err, result){
      if(err){
        console.log(err)
        res.serverError("Error: Database Error");
      }
      console.log(result)
      if(result.length === 0){
        products.create({product_id:product_id, product_name:product_name, qoh:qoh,product_price:product_price,seller_id:seller_id,product_url:product_url}).exec(function(err){
          if(err){
            console.log(err)
            res.serverError("Error: Database Error while adding entry");
          }
          res.redirect('/products/list');
        });
      }else{
        console.log(err)
        res.serverError("Create Error: Data Already Exists in the DB");
      }
    });
  },


  delete: function(req,res){
    products.destroy({id:req.query.id}).exec(function(err){
      if(err){
        res.send(500, {error: 'Delete error'});
      }
      res.redirect('/products/list');
    });
    return false;
  },

  update: function(req,res){
    var qoh = req.body.qoh;
    var product_price = req.body.product_price;
    var id = req.body.id;

    products.update({id:id},{qoh:qoh, product_price:product_price}).exec(function(err){
      if(err){
        console.log(err);
        res.send(500, {error: 'Database Error'});
      }
      res.redirect('/products/list');
    });
  },

  edit: function(req,res){
    products.findOne({id:req.query.id}).exec(function(err, result){
      if(err){
        res.send(500, {error: 'Edit error'});
      }
      res.view('edit',{product:result});
    });
  },



  // API for getting All products
  productsArr: function(req,res){

    Products.find({}).exec(function (err,products) {
    if (err){
      console.log(err);
      res.send(500, {error: 'Database error while getting part'});
    }
    res.send(200,products);
    });
  },

  productById: function(req,res){ 
    console.log(req.query);
    Products.findOne({id:req.query.productId}).exec(function (err,product) {
    if (err){
      console.log(err);
      res.send(500, {error: 'Database error while getting part'});
    }
    res.send(200,product);
    });
  },

  orderList:function(req, res){
    Orders.find({}).exec(function(err, order){
      if(err){
        console.log(err);
        res.send(500, {error: 'Database Error'});
      }
      res.view('orders', {orderslist:order});
    });
  },

};
