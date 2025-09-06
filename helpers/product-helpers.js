var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')
const imageThumbnail=require('image-thumbnail');
let options={width:50,responseType:'base64'}
module.exports={

  addProduct:(product,callback)=>{
    console.log(product)

    db.get().collection('product').insertOne(product).then((data)=>{
      callback(data.insertedId)
      console.log(data.insertedId)

    })

  },
//   createThumbnail:async(id,ext)=>{
//     try{
//           const imagePath = path.join(__dirname, "../public/product-images/", id + ext);
//               const thumbnail = await imageThumbnail(imagePath, { width: 200, height: 200 });

//         // const thumbnail= await imageThumbnail("../public/product-images/"+id+0+ext,options);
//         console.log(thumbnail)
//         }catch(err){
// console.log("err in creating thumnail: "+err)
//         }
//   },
  

  getAllProducts:(sellerId)=>{
    console.log('get all pro',sellerId)
    return new Promise(async(resolve,reject)=>{
      let product = await db.get().collection(collections.PRODUCT_COLLECTION).find({sellerId:sellerId}).toArray()
      console.log("hellllo product",product)
      let i=0;
      let products=[];
      while(i<product.length){
        if(!product[i].suspend){
          products.push(product[i])
        }
        i++;
      }
      resolve(products)


})
  },

  deleteProduct:(proId)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
        console.log(response)
        resolve(response)
        
      })
    })
  },

  getProductDetails:(proId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
        resolve(product)
      })
    })
  },

  updateProduct:(proId, proDetails)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
        $set:{
          productName:proDetails.productName,
          productDescription: proDetails.productDescription,
          productPrice: proDetails.productPrice,
          Category: proDetails.Category,
          extsRender:proDetails.extsRender
        
        }
      }).then((response)=>{
        resolve()
      })
    })
    
  },

  getAllOrders:(sellerId)=>{
    return new Promise(async(resolve,reject)=>{
      let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
        {
          $match:{status:'placed'}
        },
        // {
        //   $match:{'product.item.sellerId':sellerId}
        // },
        {
          $lookup:{
            from:collections.USER_COLLECTION,
            localField:'userId',
            foreignField:'_id',
            as:'user'
          }
        },
        {
          $lookup:{
            from:collections.PRODUCT_COLLECTION,
            localField:'products.item',
            foreignField:'_id',
            as:'product'
          }
        },
        {
          $match:{'product.sellerId':sellerId}
        }
      ]).toArray()
      console.log("hi orders.................."+orders[0].deliveryDetails.trackOrder)
      console.log('users here:  '+ orders[0].user[0].username)
      resolve(orders)
    })
  },

 

 



}