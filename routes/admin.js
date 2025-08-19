var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers.js');
const adminHelpers=require('../helpers/admin-helpers.js')
const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.redirect('/admin/login')
  }
}

/* GET users listing. */

router.get('/', verifyLogin,function(req, res, next) {
  let admin=req.session.admin
  console.log('<<<<<<<<<<<<<<<<<<<?????????')
  console.log(admin)
  if(admin.role=='seller'){
      res.render('admin/seller-dashboard')    
  }else if(admin.role=='pending_Seller'){
    res.render('admin/pending-seller')
  }else{
res.render('admin/dashboard',{adminExist:true,admin,superAdmin:true})

  //      productHelpers.getAllProducts().then((product)=>{
  //   res.render('admin/view-products', {adminExist:true ,admin, product})


  //  })
  }

});
router.get('/sellers',verifyLogin,function(req,res,next){
  let admin=req.session.admin
      adminHelpers.getAllSellers('seller').then((sellers)=>{
      console.log('<<<<<<<>>>>>>>>>>>>>>>>>>>>>')
      res.render('admin/view-sellers',{adminExist:true, admin, sellers,sellerList:true,superAdmin:true})
    })
})

router.get('/pending-sellers',verifyLogin,function(req,res,next){
  let admin=req.session.admin;
  adminHelpers.getAllSellers('pending_Seller').then((sellers)=>{
    res.render('admin/view-sellers',{adminExist:true,admin,sellers,superAdmin:true})
  })
})
router.get('/seller-register',(req,res)=>{
  res.render('admin/seller-register',{adminExist:true})
})
// router.get('/accept-seller',verifyLogin,function(req,res,next){
//   let admin=req.session.admin;
//   adminHelpers.changeSellerRole(req.body._id).then(()=>{console.log('seller role  changed')
//     res.json({status:true})
//   })
// })

router.post('/approve-seller',(req,res)=>{
  adminHelpers.approveSeller(req.body.adminId).then(()=>{
    console.log('Seller role changed')
    res.json({status:true})
  })
})
router.post('/seller-register',(req,res)=>{
  console.log(req.body)
  adminHelpers.registerSeller(req.body).then((response)=>{
    req.session.admin=response
    req.session.adminLoggedIn=true;
    res.redirect('/admin')
    console.log('hi')
    console.log(response)
  })
})
router.get('/login', (req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    res.setHeader('Cache-Control', 'no-store, must-revalidate');


    res.render('admin/login', {'loginErr':req.session.adminLoginErr,adminExist:true})
    req.session.adminLoginErr=false


  }
 })

 router.post('/login', (req,res)=>{
  adminHelpers.doLogin(req.body).then((response)=>{
    if(response.adminStatus){
      req.session.admin = response.admin
      req.session.adminLoggedIn = true
      res.redirect('/admin')
    }else{
      req.session.adminLoginErr = "Invalid username or Password"
      res.redirect('/admin/login')
    }
     console.log(response)
  })
  
 })


router.get('/add-product', verifyLogin,function(req,res){
    let admin=req.session.admin

    res.render('admin/add-product', {adminExist:true,admin})
})

router.post('/add-product', verifyLogin,(req,res)=>{
  console.log(req.body)
  console.log(req.files.productImage)
  
  productHelpers.addProduct(req.body, (id)=>{
    let image = req.files.productImage
    image.mv('./public/product-images/'+id+'.jpg', (err,done)=>{
      if(!err){
            res.redirect('/admin')


      }else{
        console.log('Error occured while Image storing '+ err)
      }

    })
  } )
})

router.get('/delete-product/:id',verifyLogin, function(req,res){
  let proId = req.params.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then(()=>{
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id', verifyLogin,async (req,res)=>{
    let admin=req.session.admin

  let product =await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{adminExist:true, admin, product})

})

router.post('/edit-product/:id',verifyLogin,(req,res)=>{
  let id = req.params.id

  productHelpers.updateProduct(id,req.body).then(()=>{
  res.redirect('/admin')


  try{
  let image = req.files.productImage
  
  image.mv('./public/product-images/'+id+'.jpg', (err,done)=>{
    if(!err){
          res.render('admin/add-product')


    }else{
      console.log('Error occured while Image storing '+ err)
    }

  })
  }catch{

  }

  // if(req.files.productImage){
  //   let image = req.files.productImage
  //   image.mv('./public/product-images/'+id+'.jpg')
  // }
})
})
router.get('/orders',verifyLogin,async(req,res)=>{
  let admin=req.session.admin
  productHelpers.getAllOrders().then((orders)=>{
    console.log('date here:::::'+orders[0].date)
    res.render('admin/view-orders',{adminExist:true, admin,orders})
  })
})


router.get('/users',verifyLogin,async(req,res)=>{
  let admin=req.session.admin
  adminHelpers.getAllUsers().then((orders)=>{
    res.render('admin/view-users',{adminExist:true, admin, orders})
  })
})

router.post('/updateProductStatus',async(req,res)=>{
  console.log("req testing")
  console.log(req.body)
adminHelpers.updateTrackStatus(req.body._id,req.body.option).then(()=>{
  res.json(true)
})
})
module.exports = router;