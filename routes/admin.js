var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers.js');
const adminHelpers=require('../helpers/admin-helpers.js');
const path=require('path');
const sharp = require('sharp');
const s3Helper = require('../helpers/s3-helper');


const verifyLogin=async (req,res,next)=>{
  if(req.session.adminLoggedIn){
    let admin=await adminHelpers.getAdminDetails(req.session.admin._id)
    if(!admin){
      req.session.admin=null
      req.session.adminLoggedIn=false
      return res.redirect('/admin/login')
    }
    req.session.admin=admin
    if(req.session.admin.suspend){
      if(req.session.admin.suspendUntilDate < Date.now()){
        await adminHelpers.revokeSeller(req.session.admin._id)
        req.session.admin.suspend=false
        next()
        
      }else{
        res.render('admin/suspend',{admin,adminExist:true})
      }
    }else{
      next()
    }
  }else{
    res.redirect('/admin/login')
  }
}

/* GET users listing. */

router.get('/products', verifyLogin,function(req, res, next) {
  let admin=req.session.admin
  if(admin.role=='seller'){
    productHelpers.getAllProductsBySeller((req.session.admin._id).toString()).then(async(product)=>{
      res.render('admin/products',{adminExist:true,admin,product})
    })
  }else{
    res.redirect('/admin');
  }
});

router.get('/all-products', verifyLogin,function(req, res, next) {
  let admin=req.session.admin
  if(admin.role!=='seller' && admin.role!=='pending_Seller'){
        productHelpers.getAllProducts().then(async(product)=>{
          let orders=await productHelpers.getAllOrdersForAdmin()
          let platformRevenue = 0;
          let pendingRevenue = 0;
          for(let order of orders){
            if(order.status==='placed'){

              if(order.paymentMethod!=='COD'){
                platformRevenue+=order.platformFee || 0
              }else{
                if(order.deliveryDetails.trackOrder.delivered.status){
                  platformRevenue+=order.totalAmount*0.1
                }else{
                  pendingRevenue+=order.totalAmount*0.1
                }
              }
            }
          }

          res.render('admin/all-products',{adminExist:true,admin,superAdmin:true,product,platformRevenue,pendingRevenue})
        })
  }else{
      res.redirect('/admin');
  }
});

router.get('/', verifyLogin,async function(req, res, next) {
  let admin=req.session.admin
  console.log('<<<<<<<<<<<<<<<<<<<?????????')
  console.log(admin)
  if(admin.role=='seller'){
    const sellerId = req.session.admin._id.toString();
    let orders = await productHelpers.getAllOrdersBySeller_dashboard(sellerId);

    let sellerRevenue = 0;
    let pendingSellerRevenue = 0;
    let codCount = 0;
    let onlineCount = 0;
    let pendingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    const sales = new Map();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    if(orders){
      for(let order of orders){
        let orderRevenueForSeller = 0;
        
        let sellerProductsInThisOrder = order.product.filter(p => p.sellerId === sellerId);
        if (sellerProductsInThisOrder.length === 0) continue;

        for (const sellerProduct of sellerProductsInThisOrder) {
            const productInOrder = order.products.find(p => p.item.toString() === sellerProduct._id.toString());
            if (productInOrder) {
                orderRevenueForSeller += productInOrder.quantity * sellerProduct.productPrice;
            }
        }

        if(order.status !== 'cancelled'){
            if(order.deliveryDetails?.trackOrder?.delivered?.status){
              sellerRevenue += orderRevenueForSeller * 0.9; // Assuming 90% share
            }else{
              pendingSellerRevenue += orderRevenueForSeller * 0.9; // Assuming 90% share
            }
        }

        // For charts
        if (order.paymentMethod === 'COD') codCount++; else onlineCount++;

        if (order.status === 'cancelled') {
          cancelledCount++;
        } else if (order.deliveryDetails?.trackOrder?.delivered?.status) {
          deliveredCount++;
        } else if (order.deliveryDetails?.trackOrder?.shipped?.status || order.deliveryDetails?.trackOrder?.outForDelivery?.status) {
          shippedCount++;
        } else if (order.status === 'placed') {
          pendingCount++;
        }

        const orderDate = new Date(order.date);
        if (orderDate >= sevenDaysAgo && order.status !== 'cancelled') {
            const day = orderDate.toISOString().split('T')[0];
            sales.set(day, (sales.get(day) || 0) + orderRevenueForSeller);
        }
      }
    }

    // Format sales data for chart
    const salesLabels = [];
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.toISOString().split('T')[0];
        salesLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        salesData.push(sales.get(day) || 0);
    }
    
    let totalOrders = orders.length;
    let customerIds = new Set();
    orders.forEach(order => customerIds.add(order.userId.toString()));
    let totalCustomers = customerIds.size;

    // Top Categories
    let topCategories = await productHelpers.getTopCategoriesBySeller(sellerId);
    let topCategoryNames = topCategories.map(c => c._id);
    let topCategoryQuantities = topCategories.map(c => c.totalQuantity);

    res.render('admin/seller-dashboard',{
        adminExist:true, admin, sellerRevenue: Math.round(sellerRevenue), pendingSellerRevenue: Math.round(pendingSellerRevenue), totalOrders, totalCustomers,
        codCount, onlineCount, pendingCount, shippedCount, deliveredCount, cancelledCount,
        salesLabels: JSON.stringify(salesLabels),
        salesData: JSON.stringify(salesData),
        topCategoryNames: JSON.stringify(topCategoryNames),
        topCategoryQuantities: JSON.stringify(topCategoryQuantities)
    })   
  }else if(admin.role=='pending_Seller'){
    res.render('admin/pending-seller',{adminExist:true,admin})
  }else{
        let orders=await productHelpers.getAllOrdersForAdmin()
          let platformRevenue = 0;
          let pendingRevenue = 0;
          let codCount = 0;
          let onlineCount = 0;
          let pendingCount = 0;
          let shippedCount = 0;
          let deliveredCount = 0;
          let cancelledCount = 0;
          for(let order of orders){
            if (order.paymentMethod === 'COD') {
              codCount++;
            } else {
              onlineCount++;
            }

            if (order.status === 'cancelled') {
              cancelledCount++;
            } else if (order.deliveryDetails?.trackOrder?.delivered?.status) {
              deliveredCount++;
            } else if (order.deliveryDetails?.trackOrder?.shipped?.status || order.deliveryDetails?.trackOrder?.outForDelivery?.status) {
              shippedCount++;
            } else if (order.status === 'placed') {
              pendingCount++;
            }
            
            if(order.status==='placed'){

              if(order.paymentMethod!=='COD'){
                platformRevenue+=order.platformFee || 0
              }else{
                if(order.deliveryDetails?.trackOrder?.delivered?.status){
                  platformRevenue+=order.totalAmount*0.1
                }else{
                  pendingRevenue+=order.totalAmount*0.1
                }
              }
            }
          }
    let users = await adminHelpers.getAllUsersList();
    let totalCustomers = users.length;
    let totalOrders = orders.length;
    let topCategories = await productHelpers.getTopSellingCategories();
    let topCategoryNames = topCategories.map(cat => cat._id);
    let topCategoryQuantities = topCategories.map(cat => cat.totalQuantity);
    res.render('admin/dashboard',{adminExist:true,admin,superAdmin:true,platformRevenue,pendingRevenue,totalOrders,totalCustomers,codCount,onlineCount,topCategoryNames:JSON.stringify(topCategoryNames),topCategoryQuantities:JSON.stringify(topCategoryQuantities), pendingCount, shippedCount, deliveredCount, cancelledCount})
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
const verifyUserLogin = (req, res, next) => {
    if (req.session.userLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}
router.get('/seller-register',verifyUserLogin,async (req,res)=>{
  let seller=await adminHelpers.getSellerByUserId(req.session.user._id)
  if(seller){
    res.redirect('/')
  }else{
    res.render('admin/seller-register',{adminExist:true})
  }
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
router.post('/seller-register',verifyUserLogin,async (req,res)=>{
  let seller=await adminHelpers.getSellerByUserId(req.session.user._id)
  if(seller){
    res.redirect('/')
  }
  else{
    req.body.userId=req.session.user._id
    adminHelpers.registerSeller(req.body).then((response)=>{
      req.session.admin=response
      req.session.adminLoggedIn=true;
      res.redirect('/admin')
    })
  }
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

router.post('/add-product', verifyLogin, (req, res) => {
  req.body.sellerId = req.session.admin._id
  productHelpers.addProduct(req.body, async (id) => {
    try {
      if (!req.files || !req.files.productImage) {
        return res.redirect('/admin');
      }

      const files = Array.isArray(req.files.productImage) ? req.files.productImage : [req.files.productImage];
      const imageUrls = new Array(files.length);
      let thumbnailUrl = '';
      
      const uploadPromises = files.map(async (file, i) => {
        const ext = path.extname(file.name);
        const s3Key = `product-images/${id}${i}${ext}`;
        
        const result = await s3Helper.uploadFile(file, s3Key);
        imageUrls[i] = result.Location;

        if (i === 0) {
          const thumbBuffer = await sharp(file.data).resize(50, 50).toBuffer();
          const thumbKey = `product-images/thumb${id}0${ext}`;
          const thumbFile = { data: thumbBuffer, name: `thumb-${file.name}` };
          const thumbResult = await s3Helper.uploadFile(thumbFile, thumbKey);
          thumbnailUrl = thumbResult.Location;
        }
      });
      
      await Promise.all(uploadPromises);

      await productHelpers.updateProductMedia(id, imageUrls, thumbnailUrl);
      
      res.redirect('/admin');

    } catch (err) {
      console.error("Error during S3 upload or DB update: ", err);
      res.redirect('/admin/add-product?error=uploadFailed');
    }
  });
});
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

router.post('/edit-product/:id', verifyLogin, async (req, res) => {
  const id = req.params.id;
  try {
    // First, update the non-image product details
    await productHelpers.updateProduct(id, req.body);

    // Check if new images were uploaded
    if (req.files && req.files.productImage) {
      const files = Array.isArray(req.files.productImage) ? req.files.productImage : [req.files.productImage];
      const newImageUrls = new Array(files.length);
      let newThumbnailUrl = '';

      // Process all new image uploads in parallel
      const uploadPromises = files.map(async (file, i) => {
        const ext = path.extname(file.name);
        const s3Key = `product-images/${id}${i}${ext}`;
        
        // Upload the new main image
        const result = await s3Helper.uploadFile(file, s3Key);
        newImageUrls[i] = result.Location;

        // If it's the first image, create and upload a new thumbnail
        if (i === 0) {
          const thumbBuffer = await sharp(file.data).resize(50, 50).toBuffer();
          const thumbKey = `product-images/thumb${id}0${ext}`;
          const thumbFile = { data: thumbBuffer, name: `thumb-${file.name}` };
          const thumbResult = await s3Helper.uploadFile(thumbFile, thumbKey);
          newThumbnailUrl = thumbResult.Location;
        }
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Update the database with the new S3 URLs, replacing the old ones
      await productHelpers.updateProductMedia(id, newImageUrls, newThumbnailUrl);
    }

    res.redirect('/admin');
  } catch (err) {
    console.error("Error during product edit or S3 upload: ", err);
    res.redirect(`/admin/edit-product/${id}?error=uploadFailed`);
  }
});
router.get('/orders',verifyLogin,async(req,res)=>{
  let admin=req.session.admin
  productHelpers.getAllOrders((admin._id).toString()).then((orders)=>{
    if (orders && orders.length > 0) {
      console.log('New date here:::::'+orders[0].date)
      console.log('username bug: '+JSON.stringify(orders[0],null,2))
    }
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
  adminHelpers.getAllUsers((admin._id).toString()).then((orders)=>{
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