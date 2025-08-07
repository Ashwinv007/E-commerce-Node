var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')

module.exports={

doLogin:(adminData)=>{
    return new Promise(async(resolve,reject)=>{
    let loginstatus = false;
    let response = {}

    let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({companyName:adminData.companyName})
    console.log(admin)
    if(admin){
         bcrypt.compare(adminData.password,admin.password).then((adminStatus)=>{
            if(adminStatus){
                                console.log('login sucess')
                                response.admin=admin
                                response.adminStatus=true
                                resolve(response)


            }else{
                console.log(admin.password)
                console.log('Invalid PAssword')
                resolve({adminStatus:false})

            }
         })
    }else{
        console.log('Admin not found')
        resolve({adminStatus:false})
    }

})
},

registerSeller:(sellerData)=>{
    return new Promise(async(resolve,reject)=>{
        sellerData.password=await bcrypt.hash(sellerData.password,10)
        db.get().collection(collections.ADMIN_COLLECTION).insertOne(sellerData).then((data) => {
                console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
        console.log(sellerData)
            resolve(db.get().collection(collections.ADMIN_COLLECTION).findOne({_id:data.insertedId}))})
    
    })
},
getAllSellers:()=>{
    return new Promise(async(resolve,reject)=>{
        let sellers=await db.get().collection(collections.ADMIN_COLLECTION).aggregate([
            {
                $match:{role:'seller'}
            },
        ]).toArray()
        console.log(sellers)
        resolve(sellers)
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