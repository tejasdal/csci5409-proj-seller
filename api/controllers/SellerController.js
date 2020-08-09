const axios = require('axios');

async function commitorrollback(bool,XA_ID) {
  
  let URL_KART = "https://q7m3gl0cj2.execute-api.us-east-1.amazonaws.com/mykart-cloud-project" + '/order/commit?perform='+bool+'&tranId='+XA_ID ;
  let URL_DEL = "http://ec2-18-212-133-17.compute-1.amazonaws.com:1337" + '/delivery/order/commit?perform='+bool+'&tranId='+XA_ID ;
  
  console.log(URL_DEL);
  console.log(URL_KART);
  let response_kart = await axios.get(URL_DEL);
  let response_del = await axios.post(URL_KART);
  console.log(response_del);
  console.log(response_kart);
}

async function xa_start(XAID) {
  console.log("Starting XA");
  let sql = "xa start '" + XAID + "';";
  await sails.getDatastore().sendNativeQuery(sql);
}

async function xa_end(XAID) {
  console.log("Endind XA");
  let sql = "xa end '" + XAID + "';";
  await sails.getDatastore().sendNativeQuery(sql);
}

async function xa_rollback(XAID) {
  console.log("Rollinng back XA");
  let sql = "xa rollback '" + XAID + "';";
  await sails.getDatastore().sendNativeQuery(sql);
}

async function xa_prepare(XAID) {
  console.log("preparing XA");
  let sql = "xa prepare '" + XAID + "';";
  await sails.getDatastore().sendNativeQuery(sql);
}

async function xa_commit(XAID) {
  console.log("comit XA");
  let sql = "xa commit '" + XAID + "';";
  await sails.getDatastore().sendNativeQuery(sql);
}

async function asyncPlaceOrder(req, res){

  // start XD with Unique ID  
  let XA_ID = req.query.tranId;

  console.log(XA_ID + " is recived XA ID");

  xa_start(XA_ID);

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

  // gets old qoh for product_id
  products.findOne({ product_id: order.product_id }).exec(function (err, product) {
    console.log("getting old qoh to reduce it");
    if (err) {
      console.log(err);
      xa_end(XA_ID);
      xa_prepare(XA_ID);
      xa_rollback(XA_ID);
      commitorrollback(false,XA_ID);
    }

    old_qoh = product.qoh;
    console.log("old qoh is: " + old_qoh);

    if (old_qoh - order.order_qty >= 0) {
      // proceed

      // reduced qoh 
      let temp = old_qoh - order.order_qty;
      console.log("qoh is substracted to :" + order.order_qty);

      products.update({ product_id: order.product_id }, { qoh: temp }).exec(function (err) {
        console.log("Updating new qoh to db");
        if (err) {
          console.log(err);
            xa_end(XA_ID);
            xa_prepare(XA_ID);
            xa_rollback(XA_ID);
            commitorrollback(false,XA_ID);
        }
        console.log("qoh is updated db");

        // creates entry in order table
        Orders.create(order).exec(function (err) {
          if (err) {
            console.log(err);
            // TODO if error occures here revert the qoh deduction
            //rollback
            xa_end(XA_ID);
            xa_prepare(XA_ID);
            xa_rollback(XA_ID);
            commitorrollback(false,XA_ID);
          }
          // res.status(200).send(order);
          //add
          xa_end(XA_ID);
          xa_prepare(XA_ID);
          xa_commit(XA_ID);
          //commi
          commitorrollback(true,XA_ID);
        });
      });

    } else {
      //rollback
      xa_end(XA_ID);
      xa_prepare(XA_ID);
      xa_rollback(XA_ID);
      commitorrollback(false,XA_ID);
    }

  });

}

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
    products.findOne({ id: req.query.productId }).exec(function (err, product) {
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

    asyncPlaceOrder(req, res);
    res.status(200).send("Processing order.");
    // // start XD with Unique ID  
    // let XA_ID = req.query.tranId;

    // xa_start(XA_ID);

    // let order = {
    //   order_id: req.body.order_id,
    //   user_id: req.body.user_id,
    //   seller_id: req.body.seller_id,
    //   order_qty: req.body.order_qty,
    //   product_id: req.body.product_id,
    //   user_address: req.body.user_address,
    //   order_total: req.body.order_total,
    // };


    // let old_qoh;

    // // gets old qoh for product_id
    // products.findOne({ product_id: order.product_id }).exec(function (err, product) {
    //   console.log("getting old qoh to reduce it");
    //   if (err) {
    //     console.log(err);
    //     res.send(500, { error: 'Database error while getting old qoh' });
    //   }

    //   old_qoh = product.qoh;
    //   console.log("old qoh is: " + old_qoh);

    //   if (old_qoh - order.order_qty >= 0) {
    //     // proceed

    //     // reduced qoh 
    //     let temp = old_qoh - order.order_qty;
    //     console.log("qoh is substracted to :" + order.order_qty);

    //     products.update({ product_id: order.product_id }, { qoh: temp }).exec(function (err) {
    //       console.log("Updating new qoh to db");
    //       if (err) {
    //         console.log(err);
    //         res.send(500, { error: 'Database Error while updating new qoh' });
    //       }
    //       console.log("qoh is updated db");

    //       // creates entry in order table
    //       Orders.create(order).exec(function (err) {
    //         if (err) {
    //           console.log(err);
    //           res.send(500, { error: 'Database Error' });
    //           // TODO if error occures here revert the qoh deduction
    //         }
    //         res.status(200).send(order);
    //       });
    //     });

    //     xa_end(XA_ID);
    //     xa_prepare(XA_ID);
    //     xa_commit(XA_ID);
    //     //commi
    //     commitorrollback(true,XA_ID);

    //   } else {
    //     //rollback
    //     xa_end(XA_ID);
    //     xa_prepare(XA_ID);
    //     xa_rollback(XA_ID);
    //     commitorrollback(false,XA_ID);
    //   }

    // });


  },

};


