var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var collections=require('../config/collections')
const userHelpers=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){

    next()
  }else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
    let user=req.session.user

  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)

  }
  productHelpers.getAllProducts().then((products)=>{
      res.render('user/view-products', {products,user,cartCount});

  })
});


router.get('/login',function(req,res,next){
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
  res.render('user/login',{"loginErr":req.session.logginErr})
  req.session.loginErr=false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  
userHelpers.doSignup(req.body).then((response)=>{
  console.log(response)
  req.session.loggedIn=true
  req.session.user=response.user
})
})

router.post('/login',(req,res)=>{
  console.log(req.body)
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.logginErr="Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  
  let products=await userHelpers.getCartProducts(req.session.user._id)
  res.render('user/cart',{products,user:req.session.user})
})
router.get('/add-to-cart/:id',(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
userHelpers.changeProductQuantity(req.body).then((response)=>{
  res.json(response)
})
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user._id})
})

router.post('/place-order',async(req,res)=>{
let products;
let totalPrice;
let reOrderStatus=false
if(!req.body.reOrder){
  console.log('test')
  products=await userHelpers.getCartProductList(req.body.userId)
  totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  console.log('totalPrice is: ',totalPrice)
}else{
  reOrderStatus=true
  let reOrderDetails=await userHelpers.reOrderProducts(req.body.reOrder)
  if(reOrderDetails && reOrderDetails.length>0){
    products=reOrderDetails[0].products;
    totalPrice=reOrderDetails[0].totalPrice
  }
}

userHelpers.placeOrder(req.body,products,totalPrice,reOrderStatus,req.body.reOrder).then((orderId)=>{
  if(req.body['payment-method'==='COD']){
    res.json({codSuccess:true})
  }else{
    userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
      res.json(response)
    })
  }
})
})

module.exports = router;
