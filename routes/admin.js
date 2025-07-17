var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  let products=[
    {
      name:"Samsung A14",
      category:"Mobile",
      description:"This is a  Good Phone",
      image:"https://images.samsung.com/is/image/samsung/p6pim/in/sm-a146bzkgins/gallery/in-galaxy-a14-5g-sm-a146-446745-sm-a146bzkgins-539631714?$684_547_PNG$"
    },
     {
      name:"Realme 9 pro",
      category:"Mobile",
      description:"This is a  Good Phone",
      image:"https://fdn2.gsmarena.com/vv/bigpic/realme-9-pro.jpg"
    },
     {
      name:"Samsung A50",
      category:"Mobile",
      description:"This is a  Good Phone",
      image:"https://emibaba.com/wp-content/uploads/2019/04/Samsung-A50s-black-5.jpg"
    },
     {
      name:"IPHONE 16",
      category:"Mobile",
      description:"This is a  Good Phone",
      image:"https://m.media-amazon.com/images/I/61JvFLHZ6NL._SX522_.jpg"
    },
     {
      name:"Lenova Thinkpad T14",
      category:"Laptop",
      description:"This is a  Good Laptop",
      image:"https://edify.club/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fapi-files-connect-saas%2Fuploads%2F1741089147306.png&w=640&q=75"
    },
  ]
  res.render('admin/view-products',{admin:true,products})
});

router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})


router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.productImage)
})
module.exports = router;
