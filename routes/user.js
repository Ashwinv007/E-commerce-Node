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
router.get('/', function(req, res, next) {
  let user=req.session.user
  productHelpers.getAllProducts().then((products)=>{
      res.render('user/view-products', {products,user});

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

router.get('/cart',verifyLogin,(req,res)=>{
  verifyLogin()
  res.render('/cart')
})



module.exports = router;
