
module.exports = {

  list: function (req, res) {
    products.find({}).exec(function (err, pro) {
      if (err) {
        console.log(err);
        res.send(500, { error: 'Database Error' });
      }
      res.view('list', { prod: pro });
    });
  },

  add: function (req, res) {
    res.view('add');
  },

  create: function (req, res) {

    var product_name = req.body.product_name;
    var product_id = req.body.product_id;
    var qoh = req.body.qoh;
    var product_price = req.body.product_price;
    var product_url = req.body.product_url;
    var seller_id = 1998;

    console.log(product_name, product_id, qoh);

    products.find({ product_id: product_id, product_name: product_name }).exec(function (err, result) {
      if (err) {
        console.log(err)
        res.serverError("Error: Database Error");
      }
      console.log(result)
      if (result.length === 0) {
        products.create({ product_id: product_id, product_name: product_name, qoh: qoh, product_price: product_price, seller_id: seller_id, product_url: product_url }).exec(function (err) {
          if (err) {
            console.log(err)
            res.serverError("Error: Database Error while adding entry");
          }
          res.redirect('/products/list');
        });
      } else {
        console.log(err)
        res.serverError("Create Error: Data Already Exists in the DB");
      }
    });
  },


  delete: function (req, res) {
    products.destroy({ id: req.query.id }).exec(function (err) {
      if (err) {
        res.send(500, { error: 'Delete error' });
      }
      res.redirect('/products/list');
    });
    return false;
  },

  update: function (req, res) {
    var qoh = req.body.qoh;
    var product_price = req.body.product_price;
    var id = req.body.id;

    products.update({ id: id }, { qoh: qoh, product_price: product_price }).exec(function (err) {
      if (err) {
        console.log(err);
        res.send(500, { error: 'Database Error' });
      }
      res.redirect('/products/list');
    });
  },

  edit: function (req, res) {
    products.findOne({ id: req.query.id }).exec(function (err, result) {
      if (err) {
        res.send(500, { error: 'Edit error' });
      }
      res.view('edit', { product: result });
    });
  },



  // API for getting All products
  productsArr: function (req, res) {

    Products.find({}).exec(function (err, products) {
      if (err) {
        console.log(err);
        res.send(500, { error: 'Database error while getting part' });
      }
      res.send(200, products);
    });
  },

  productById: function (req, res) {
    console.log(req.query);
    Products.findOne({ id: req.query.productId }).exec(function (err, product) {
      if (err) {
        console.log(err);
        res.send(500, { error: 'Database error while getting part' });
      }
      res.send(200, product);
    });
  },

  orderList: function (req, res) {
    Orders.find({}).exec(function (err, order) {
      if (err) {
        console.log(err);
        res.send(500, { error: 'Database Error' });
      }
      res.view('orders', { orderslist: order });
    });
  },

  createOrder: async function (req, res) {


    // start XD with Unique ID  

    let startQuery = "xa start '1';";
    let stopQuery = "xa end '1';";
    let prepareQuery = "xa prepare '1';";
    let commitQuery = "xa commit '1';";

    await sails.getDatastore().sendNativeQuery(startQuery);
    await sails.getDatastore().sendNativeQuery(stopQuery);
    await sails.getDatastore().sendNativeQuery(prepareQuery);
    await sails.getDatastore().sendNativeQuery(commitQuery);

    let order = {
      order_id: req.body.order_id,
      user_id: req.body.user_id,
      seller_id: req.body.seller_id,
      order_qty: req.body.order_qty,
      product_id: req.body.product_id,
      user_address: req.body.user_address,
      order_total: req.body.order_total,
    };

    
    let old_qoh;

    products.findOne({ product_id: order.product_id }).exec(function (err, product) {
      console.log("getting old qoh to reduce it");
      if (err) {
        console.log(err);
        res.send(500, { error: 'Database error while getting old qoh' });
      }

      old_qoh = product.qoh;
      console.log("old qoh is: " + old_qoh );


      order.order_qty = old_qoh - order.order_qty;
      console.log("qoh is substracted to :" + order.order_qty );

      products.update({ product_id: order.product_id }, { qoh: order.order_qty}).exec(function (err) {
        console.log("Updating new qoh to db");
        if (err) {
          console.log(err);
          res.send(500, { error: 'Database Error while updating new qoh' });
        }
        console.log("qoh is updated db");

        Orders.create(order).exec(function (err) {
          if (err) {
            console.log(err);  
            res.send(500, { error: 'Database Error' });
          }
          res.status(200).send(order);
        });
      });


    });


    

    

    
  },

};
