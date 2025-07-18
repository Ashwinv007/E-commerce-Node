var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
  res.render('admin/view-products',{admin:true,products})

  })
});

router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})


router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.productImage)
  

  

  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.productImage
    console.log(id);
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-product")
      }else{
        console.log(err)
      }
    })
    res.render("admin/add-product")
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
})


router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelpers.updateProduct(id,req.body).then(()=>{
    res.redirect('/admin')
    let image=req.files.productImage
    image.mv('./public/product-images/'+id+'.jpg')
  })
})
module.exports = router;
