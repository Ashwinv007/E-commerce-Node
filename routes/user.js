var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var collections=require('../config/collections')
/* GET home page. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
      res.render('user/view-products', {products,admin:false});

  })
});

module.exports = router;
