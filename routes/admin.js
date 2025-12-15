var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers.js');
const adminHelpers=require('../helpers/admin-helpers.js');
const path=require('path');
const sharp = require('sharp');


const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    if(req.session.admin.suspend){
      if(req.session.admin.suspendUntilDate >Date.now()){
        adminHelpers.revokeSeller(req.session.admin._id).then(()=>{
          next()
        })
      }else{
        res.render('admin/suspend')
      }
    }else{
      next()
    }
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
    productHelpers.getAllProducts(req.session.admin._id).then((product)=>{
      res.render('admin/seller-dashboard',{adminExist:true,admin,product})    

    })
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
router.post('/reject-seller',(req,res)=>{
  adminHelpers.rejectSeller(req.body.adminId).then(()=>{
    console.log("Rejecting Seller")
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

 router.get('/logout', (req,res)=>{
    req.session.admin=null
    req.session.adminLoggedIn=false
      res.redirect('/admin/login')
   })


router.get('/add-product', verifyLogin,function(req,res){
    let admin=req.session.admin

    res.render('admin/add-product', {adminExist:true,admin})
})

router.post('/add-product', verifyLogin,(req,res)=>{
  if(typeof(req.body.extsRender)==='string'){
  req.body.extsRender=[req.body.extsRender]

  }
  console.log(req.body)
  // console.log(req.files.productImage)
  
  productHelpers.addProduct(req.body,(id)=>{
    let images=[];
    let exts=[]
    let error_Status=false
          console.log("kellllo"+req.files.productImage)
if(req.files.productImage.length>1){
 for(let i=0;i<req.files.productImage.length;i++){
      images[i]=req.files.productImage[i]
      if(images[i]){
        console.log('helloimage: '+images[i]);
      }else{
        images[i]=req.files.productImage
        console.log('single file here: '+images[i])
      }
      console.log(images[i].name)
      exts[i]=path.extname(images[i].name)
      if(exts[i]){
        console.log('hellloext: '+exts[i])
      }else{
        exts[i]=path.extname(images[i].name)
      }
      images[i].mv('./public/product-images/'+id+i+exts[i], (err,done)=>{
      if(err){
        error_Status=true
      console.log('errrrrror here: '+err)
            // res.redirect('/admin')


      }else{
        // productHelpers.createThumbnail(id,exts[0])
        sharp('./public/product-images/'+id+0+exts[0]).resize(50,50).toFile('./public/product-images/'+'thumb'+id+0+exts[0],(err,resizeImage)=>{
          if(err){
            console.log(err);
          }else{
            console.log(resizeImage)
          }
        })
        

      }

    })
    }
}else{
  //  for(let i=0;i<req.files.productImage.length;i++){
      images=req.files.productImage
      // if(images[i]){
      //   console.log('helloimage: '+images[i]);
      // }else{
      //   images[i]=req.files.productImage
      //   console.log('single file here: '+images[i])
      // }
      // console.log(images[i].name)
      exts=path.extname(images.name)
      // if(exts[i]){
      //   console.log('hellloext: '+exts[i])
      // }else{
      //   exts[i]=path.extname(images[i].name)
      // }
      images.mv('./public/product-images/'+id+0+exts, (err,done)=>{
      if(err){
        error_Status=true
      console.log('errrrrror here: '+err)
            // res.redirect('/admin')


      }else{
        // productHelpers.createThumbnail(id,exts[0])
        sharp('./public/product-images/'+id+0+exts).resize(50,50).toFile('./public/product-images/'+'thumb'+id+0+exts,(err,resizeImage)=>{
          if(err){
            console.log(err);
          }else{
            console.log(resizeImage)
          }
        })
        

      }

    })
    // }
}
   
    if(error_Status){
      console.log("Error occured while storing images: "+err);
    }else{
      res.redirect('/admin');
    }

    // let image = req.files.productImage
    // let ext =path.extname(image.name)
  
  } )
})
router.post('/suspend-seller',verifyLogin,(req,res)=>{
  adminHelpers.suspendSeller(req.body.adminId).then(()=>{
    res.json({status:true})
  })
})
router.post('/revoke-seller',verifyLogin,(req,res)=>{
  adminHelpers.revokeSeller(req.body.adminId).then(()=>{
    res.json({status:true})
  })
})

router.post('/remove-seller',verifyLogin,(req,res)=>{
  adminHelpers.removeSeller(req.body.adminId).then(()=>{
    adminHelpers.removeSellerProducts(req.body.adminId).then(()=>{
    res.json({status:true})

    })
  })
})
router.get('/coupons',verifyLogin,async function(req,res){
      let admin=req.session.admin
      console.log('seller admin hera: ',admin)
  await adminHelpers.getCoupons(admin).then((coupons)=>{
    console.log('coupons here: ',coupons)
  res.render('admin/view-coupons',{adminExist:true,admin,coupons})

  })
  
})

router.get('/add-coupon',verifyLogin,(req,res)=>{
      let admin=req.session.admin

  res.render('admin/add-coupon',{adminExist:true,admin})
})
router.post('/add-coupon',verifyLogin,(req,res)=>{
  adminHelpers.addCoupon(req.body).then(()=>{

    res.redirect('/admin/coupons')
  })
})
// router.post('/ad')
router.get('/edit-coupon/:id',verifyLogin,async(req,res)=>{
  let couponId=req.params.id
  adminHelpers.getCouponDetails(couponId).then((coupon)=>{
        let admin=req.session.admin
        console.log('heelo coupon',coupon)

    res.render('admin/edit-coupon',{adminExist:true,admin,coupon})
  })
})
router.post('/edit-coupon',verifyLogin,async(req,res)=>{
  // let couponId=req.params.id
  console.log('coupon Check',req.body)
  adminHelpers.updateCoupon(req.body).then((response)=>{
    res.redirect('/admin')
  })
})
router.post('/verify-coupon',verifyLogin,async(req,res)=>{
  console.log('data her: ',req.body.coupon,req.body.productList)
   await adminHelpers.verifyCoupon(req.body.coupon,req.body.productList).then((response)=>{
    
  })
  

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
  // res.redirect('/admin')


   let images=[];
    let exts=[]
    let err=false
          console.log("kellllo"+req.files.productImage)

    for(let i=0;i<req.files.productImage.length;i++){
      images[i]=req.files.productImage[i]
      console.log(images[i].name)
      exts[i]=path.extname(images[i].name)
      images[i].mv('./public/product-images/'+id+i+exts[i], (err,done)=>{
      if(err){
        err=true
      
            // res.redirect('/admin')


      }

    })
    }
    if(err){
      console.log("Error occured while storing images: "+err);
    }else{
      res.redirect('/admin');
    }


  // if(req.files.productImage){
  //   let image = req.files.productImage
  //   image.mv('./public/product-images/'+id+'.jpg')
  // }
})
})
router.get('/orders',verifyLogin,async(req,res)=>{
  let admin=req.session.admin
  productHelpers.getAllOrders(admin._id).then((orders)=>{
     console.log('New date here:::::'+orders[0].date)
  console.log('username bug: '+JSON.stringify(orders[0],null,2))
    res.render('admin/view-orders',{adminExist:true, admin,orders})
  })
})
router.post('/check-coupon',verifyLogin,async(req,res)=>{
  adminHelpers.checkCoupon(req.body.couponName).then((response)=>{
    res.json({response})
  })
})

router.get('/users',verifyLogin,async(req,res)=>{
  let admin=req.session.admin
  adminHelpers.getAllUsers(admin._id).then((orders)=>{
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