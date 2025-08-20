var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')

module.exports={

  addProduct:(product,callback)=>{
    console.log(product)

    db.get().collection('product').insertOne(product).then((data)=>{
      callback(data.insertedId)
      console.log(data.insertedId)

    })

  },

  

  getAllProducts:()=>{
    return new Promise(async(resolve,reject)=>{
      let product = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
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
        
        }
      }).then((response)=>{
        resolve()
      })
    })
    
  },

  getAllOrders:()=>{
    return new Promise(async(resolve,reject)=>{
      let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
        {
          $match:{status:'placed'}
        },
        {
          $lookup:{
            from:collections.USER_COLLECTION,
            localField:'userId',
            foreignField:'_id',
            as:'user'
          }
        }
      ]).toArray()
      console.log("hi orders.................."+orders[0].deliveryDetails.trackOrder)
      console.log('users here:  '+ orders[0].user[0].username)
      resolve(orders)
    })
  },

 

 



}