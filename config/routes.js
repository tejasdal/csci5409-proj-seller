module.exports.routes = {

  '/': { view: 'pages/homepage' },
  // CRUD for Seller
  'GET /products/list': 'SellerController.list',

};
