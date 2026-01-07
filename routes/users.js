var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers.js');
const userHelpers = require('../helpers/user-helpers.js')
const passport = require("passport");
const adminHelpers=require('../helpers/admin-helpers.js');

router.use(async (req, res, next) => {
    if (req.session.user) {
        res.locals.sellerAccount = await adminHelpers.getSellerByUserId(req.session.user._id);
    }
    next();
});

const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
  req.session.user=req.user;
  req.session.userLoggedIn=true;
  res.redirect('/')
})
/* GET home page. */
router.get('/',verifyLogin, async function(req, res, next) {
  let cartCount=null
  let user = req.session.user
  if(req.session.user){
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  console.log(user);
  res.render('index', {admin:false , user,cartCount, isHomepage: true})
});

router.get('/products', verifyLogin, async function(req, res, next) {
    let cartCount = null;
    let user = req.session.user;
    if (req.session.user) {
        cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    productHelpers.getAllProducts().then((product) => {
        res.render('user/view-products', { admin: false, product, user, cartCount, isHomepage: true, activeCategory: req.query.category  });
    });
});
   router.get('/login', (req,res)=>{
    if(req.session.user){
      res.redirect('/')
    }else{
      res.setHeader('Cache-Control', 'no-store, must-revalidate');


      res.render('user/login', {'loginErr':req.session.userLoginErr})
      req.session.userLoginErr=false


    }
   })

   router.get('/signup', (req,res)=>{
    res.redirect('/login#signup')
   

    // res.redirect('/')
   })
   router.post('/verifyOtp',async(req,res)=>{
    console.log('otp entered: ',req.body.otp)
   await userHelpers.verifyOTP(req.body.otp,req.session.userOTP).then((response)=>{
      if(response.success){
        if(req.session.userData){
userHelpers.doSignup(req.session.userData).then((response)=>{
      console.log('hi signup',response)
      req.session.user=response
      req.session.userLoggedIn=true
      res.redirect('/')
    })
        }else{
          res.render('user/change-password')
        }
  
      }else{
        res.redirect('/signup')
      }
    })
   
   })
router.post('/change-password',async(req,res)=>{
  await userHelpers.changePassword(req.session.userEmail,req.body.password).then(()=>{
    res.redirect('/')
  })
})
   router.post('/resendOtp',async(req,res)=>{
     await userHelpers.generateOTP().then(async(otp)=>{
      console.log('userEmail:  ',req.session.userData.email)
      await userHelpers.sendVerificationEmail(req.session.userData.email,otp).then((response)=>{
         req.session.userOTP=otp;
        //  let response={}
        //  res.json(response)
        // req.session.userData={email:req.body.email,Password:req.body.Password}
         res.render('user/verifyOTP')
       
      })
    })
   })
   router.get('/forgot-password',(req,res)=>{
    res.render('user/forgot-password')
   })
   router.post('/forgot-password',async(req,res)=>{
     userHelpers.generateOTP().then((otp)=>{
      userHelpers.sendVerificationEmail(req.body.email,otp).then((response)=>{
         req.session.userOTP=otp;
         req.session.userEmail=req.body.email
        // req.session.userData={email:req.body.email,Password:req.body.Password}
        res.render('user/verifyOTP')
       
      })
    })
   })
   router.post('/signup', (req,res)=>{
    userHelpers.generateOTP().then((otp)=>{
      userHelpers.sendVerificationEmail(req.body.email,otp).then((response)=>{
         req.session.userOTP=otp;
        req.session.userData={username:req.body.username,email:req.body.email,Password:req.body.Password}
        res.render('user/verifyOTP')
       
      })
    })
   
  })


   router.post('/login', (req,res)=>{
    userHelpers.doLogin(req.body).then((response)=>{
      if(response.status){
        req.session.user = response.user
        req.session.userLoggedIn = true
        res.redirect('/')
      }else{
        req.session.userLoginErr = "Invalid username or Password"
        res.redirect('/login')
      }
       console.log(response)
    })
    
   })

   router.get('/logout', (req,res)=>{
    req.session.user=null
    req.session.userLoggedIn=false
      res.redirect('/')
   })
   router.get('/view-product/:id',verifyLogin,async(req,res)=>{
       let cartCount=null
  let user = req.session.user
  if(req.session.user){
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }

  let product = await productHelpers.findProduct(req.params.id);
  let reviews = await userHelpers.getReviews(req.params.id);
  let userReview = null; // Initialize userReview as null

  if (req.session.user) { // Only check for user's review if user is logged in
    userReview = await userHelpers.checkReview(req.session.user._id, req.params.id); // This now returns the review object or null
    if (userReview) {
      // Filter out the user's review from the main reviews array to avoid duplication
      reviews = reviews.filter(review => review._id.toString() !== userReview._id.toString());
    }
  }
  
  let response = await userHelpers.getRatingSummary(req.params.id,reviews); // Pass the potentially filtered reviews
  let hasOrdered = false; // Initialize hasOrdered

  if (req.session.user) { // Only check if user is logged in
    hasOrdered = await userHelpers.hasUserOrderedProduct(req.session.user._id, req.params.id);
  }
  
  console.log('rev here: ',response)
  res.render('user/view-product',{product,user,cartCount,reviews,userReview,response,hasOrdered}) // Pass userReview, not userReviewed
   })

   router.get('/cart', verifyLogin,async (req,res)=>{
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let totalValue=0
    if(products.length>0){
      totalValue = await userHelpers.getTotalAmount(req.session.user._id)


    }
    console.log(products)
    res.render('user/cart', {products, user:req.session.user,totalValue})
   })

   router.get('/add-to-cart/:id',async (req,res)=>{
console.log('api call')
    userHelpers.addToCart(req.params.id,req.session.user._id).then((response)=>{
      res.json(response)
    })
    
   })

   router.get('/find-product/:value',async (req,res)=>{
    console.log('find call')
        userHelpers.findProducts(req.params.value).then((matchingProducts)=>{
          if(matchingProducts.length===0){
                        console.log("No matching products found.");

            res.render('user/error-products')


          }else{
            res.render('user/view-products', {matchingProducts, isHomepage: true})

          }

        })
        
       })
       router.post('/submit-review',(req,res)=>{
        console.log('hello pro: ',req.body)
        userHelpers.submitReview(req.body).then(()=>{
          res.redirect(`/view-product/${req.body.productId}`)
        })
       })
    
   router.post('/change-product-quantity',(req,res,next)=>{
    userHelpers.changeProductQuantity(req.body,req.session.user._id).then(async(response)=>{
      console.log('totalhere'+ req.session.user)
      response.total = await userHelpers.getTotalAmount(req.session.user._id)

      res.json(response)
     
    })
   })
   router.post('/verify-coupon',verifyLogin,async(req,res)=>{
    let productList=await userHelpers.getCartProducts(req.session.user._id)
        let total = await userHelpers.getTotalAmount(req.session.user._id)

    console.log('hi productList',productList)
     console.log('data her: ',req.body.coupon)
      await adminHelpers.verifyCoupon(req.body.coupon,total,productList).then((response)=>{
    
       res.json({response})
     })
     
   
   })
  //  router.post('/verify-coupon',verifyLogin,async(req,res)=>{
  // await adminHelpers.verifyCoupon(req.body.coupon,req.body.productList).then((response)=>{
    
  // })
  // let response={
  //   sucess:true
  // }
  // res.json(response)


   router.get('/place-order',verifyLogin,async(req,res)=>{
  
    let total = await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/place-order',{total,user:req.session.user})
   })
   
router.post('/place-order',async(req,res)=>{
  let products;
    let totalPrice ;
    let reOrderStatus = false

  if (!req.body.reOrder){
    console.log('hi bro')

    products = await userHelpers.getCartProducts(req.body.userId)
    totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    console.log('totalpeice is: ', totalPrice)
    

      }else{
        reOrderStatus = true
        let reOrderDetails = await userHelpers.reOrderProducts(req.body.reOrder);
    console.log("hi reorder: ",req.body.reOrder)
      if (reOrderDetails && reOrderDetails.length > 0) {
         products = reOrderDetails[0].products;
         console.log('check: ',products)
         totalPrice = reOrderDetails[0].totalAmount;
        // await userHelpers.cancelOrderProducts(req.body.reOrder)
        console.log('retotalpeice is: ', totalPrice)

        
      }



  }
  if(req.body.discount){
    totalPrice=totalPrice-discount
  }

 
  userHelpers.placeOrder(req.body,products,totalPrice,reOrderStatus,req.body.reOrder).then((orderId)=>{
    console.log("order from user"+orderId)
    console.log('productts of order here :', products)
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        console.log("then 2order from user"+orderId)
        res.json(response)

      })
    }
  }).then(async()=>{
    for(let i=0;i<products.length;i++){
      console.log('hello order pro: ',products[i].quantity)
      await productHelpers.decreaseStockQuantity(products[i])
    }
  })
  console.log(req.body)
})

router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/orders',verifyLogin,async(req,res)=>{
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  console.log('heollo user orders: '+JSON.stringify(orders[0],null,2))
  res.render('user/orders',{user:req.session.user,orders})
})
router.post('/cancel-ordered-products',async(req,res)=>{
  let canceledOrder = await userHelpers.cancelOrderProducts(req.body.cancelOrderId)
  res.json(canceledOrder)
  // res.render('user/view-order-products',{user:req.session.user,products})
})

router.get('/reorder-products/:reOrderId', (req, res) => {
  userHelpers
    .reOrderProducts(req.params.reOrderId)
    .then((reOrderDetails) => {
      // Check if reOrderDetails is defined
      if (reOrderDetails && reOrderDetails.length > 0) {
        var firstProduct = reOrderDetails[0];
        if (firstProduct.deliveryDetails) {
          var address = firstProduct.deliveryDetails.address;
          var pincode = firstProduct.deliveryDetails.pincode;
          var mobile = firstProduct.deliveryDetails.mobile;
          var totalAmount = firstProduct.totalAmount;
          console.log('fptotal is: ',totalAmount)

          // Constructing the URL with parameters
          // var url =
          //   '/place-order?address=' +
          //   encodeURIComponent(address) +
          //   '&pincode=' +
          //   encodeURIComponent(pincode) +
          //   '&mobile=' +
          //   encodeURIComponent(mobile) +
          //   '&totalAmount=' +
          //   encodeURIComponent(totalAmount);

          // Send JSON response with reOrderDetails
        
        }
        // Pass the values to the HBS template
        res.render('user/place-order', {
          address: address,
          user: req.session.user,
          pincode: pincode,
          mobile: mobile,
          totalAmount: totalAmount,
          reOrder:req.params.reOrderId
        });


      } else {
        res.status(404).json({ error: 'Reorder details not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

router.get('/view-order-products/:id',verifyLogin,async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})

router.get('/track-order-delivery/:id',verifyLogin,async(req,res)=>{
  let trackOrder = await userHelpers.trackOrderDetails(req.params.id)
  console.log('locate hi', trackOrder)
  res.render('user/track-order',{user:req.session.user,trackOrder})
})
router.post('/verify-payment',(req,res)=>{
 
  console.log(req.body)
  const paymentGroupId = req.body['order[receipt]']; // Renamed for clarity
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.distributeAndRecordPayouts(paymentGroupId).then(()=>{
      userHelpers.changePaymentStatus(paymentGroupId).then(()=>{
        console.log("Payment Successfull")
        res.json({status:true})
      })
    })
  }).catch((err)=>{
    console.log(err)
    res.json({status:false, errMssg:'ERRRROR'})
    console.log(res.json)
  })
})
module.exports = router;
