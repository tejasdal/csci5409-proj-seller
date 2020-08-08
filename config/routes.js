module.exports.routes = {

  '/': { view: 'pages/homepage' },
  // CRUD for Seller
  'GET /products/list': 'SellerController.list',
  'GET /products/test': 'SellerController.list2',
  'GET /products/add': 'SellerController.add',
  'POST /products/create': 'SellerController.create',
  'POST /products/delete': 'SellerController.delete',
  'POST /products/edit': 'SellerController.edit',
  'POST /products/update': 'SellerController.update',

  // APIs
  'GET /products/get-all-products': 'SellerController.productsArr',

};
