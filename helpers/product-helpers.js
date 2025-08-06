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
      resolve(product)


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

  getAllUsers:()=>{
    return new Promise(async(resolve,reject)=>{
      let orders =await db.get().collection(collections.ORDER_COLLECTION).aggregate([
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
        },
        {
          $lookup:{
            from:collections.PRODUCT_COLLECTION,
            localField:'products.item',
            foreignField:'_id',
            as:'product'
          }
        }

      ]).toArray()
      console.log('resolvieng orders testing : '+orders[0].product[0].productName)
      resolve(orders)
    })
  },

  updateTrackStatus:(_id,option)=>{
    return new Promise(async(resolve,reject)=>{
   
    let order=await db.get().collection(collections.ORDER_COLLECTION).findOne({_id:objectId(_id)})
    if(order){
          if(option=='ship'){
 db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(_id)},
      {
        $set:{
              "deliveryDetails.trackOrder.shipped":true,
              "deliveryDetails.trackOrder.stage_od":false,
              "deliveryDetails.trackOrder.stage_ship":true
        }
      }
    )    }else if(option=='OAD'){
db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(_id)},
      {
        $set:{
              "deliveryDetails.trackOrder.outForDelivery":true,
              "deliveryDetails.trackOrder.stage_ship":false,
              "deliveryDetails.trackOrder.stage_oad":true,
        }
      }
    )    }else{
db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(_id)},
      {
        $set:{
              "deliveryDetails.trackOrder.delivered":true,
              "deliveryDetails.trackOrder.stage_oad":false,
        }
      }
    )     }
     

    }else{
      console.log('db not found')
    }
    resolve()
    })
    

  }



}