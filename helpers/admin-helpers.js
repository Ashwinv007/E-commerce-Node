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
getAllSellers:(choice)=>{
    return new Promise(async(resolve,reject)=>{
        let sellers=await db.get().collection(collections.ADMIN_COLLECTION).find(
            // {
            //     $match:{role:'seller'}
            // },
            {
                $or:[
                    {role:'pending_Seller'},
                    {role:'seller'}
                ]
            },
        ).toArray()
        console.log('_________________________')
        let i=0;
        let sellerArray=[];
        while(i<sellers.length){
          if(choice==='seller'){
            if(sellers[i].role==='seller'){
              sellerArray.push(sellers[i]);
            }
          }else if(choice==='pending_Seller'){
            if(sellers[i].role==='pending_Seller'){
              sellerArray.push(sellers[i]);
            }
          }
          i++;
        }
        console.log('---------------------------------------------')
        console.log(sellerArray)
        resolve(sellerArray)
    })
},
getCoupons:(adminId)=>{
  return new Promise(async(resolve,reject)=>{
 if(adminId){
    let coupons=await db.get().collection(collections.COUPON_COLLECTION).aggregate([
      {
        $match:{sellerId:adminId._id}
      }
    ]).toArray()
    console.log('hello cop...',coupons)
    resolve(coupons)
  }else{
    let coupons=await db.get().collection(collections.COUPON_COLLECTION).find().toArray()
    resolve(coupons)
  }
  })
 
},
addCoupon:(couponDetails)=>{
  return new Promise(async(resolve,reject)=>{
    db.get().collection(collections.COUPON_COLLECTION).insertOne(couponDetails).then(()=>{
      resolve()
    })
  })
},
getCouponDetails:(couponId)=>{
  return new Promise(async(resolve,reject)=>{
    db.get().collection(collections.COUPON_COLLECTION).findOne({_id:objectId(couponId)}).then((response)=>{
      resolve(response)
    })
  })
},
checkCoupon:(couponName)=>{
  return new Promise(async(resolve,reject)=>{
    let coupon=await db.get().collection(collections.COUPON_COLLECTION).findOne({couponName:couponName})

    if(coupon){
      console.log('cp here: ',coupon)
      console.log('got cp here: ',couponName)
      resolve({
        response:{
          success:true
        }
      })
    }else{
      resolve({
        response:{
          success:false
        }
      })
    }
  })
},
updateCoupon:(coupon)=>{
  return new Promise(async(resolve,reject)=>{
    console.log('updateCoupin here: ',coupon)
    db.get().collection(collections.COUPON_COLLECTION).updateOne({_id:objectId(coupon.couponId)},
   { 
    $set:{
    couponName:coupon.couponName,
    startDate:coupon.startDate,
    endDate:coupon.endDate,
    offerPrice:coupon.offerPrice,
    sellerId:coupon.sellerId,
    minPrice:coupon.minPrice

    }
  }).then((response)=>{
    resolve()
  })
  })
},
verifyCoupon:(verifyCoupon,total,productList)=>{
  return new Promise(async(resolve,reject)=>{
       let q=new Date();
  let m=q.getMonth();
  let d=q.getDay();
  let y=q.getFullYear();
    console.log('hellocoupon :  ',verifyCoupon)
    let coupon=await db.get().collection(collections.COUPON_COLLECTION).findOne({couponName:verifyCoupon})
    if(coupon){
       let currentDate=new Date(y,m,d)
       console.log('curretn date: ',currentDate)
       console.log('exp date :',coupon.endDate)
      if(currentDate<=new Date(coupon.endDate)){
          for(let i=0;i<productList.length;i++){
        if(coupon.sellerId===productList[i].product.sellerId){
          if(total>=coupon.minPrice){
             let price=(Number((productList[i].product.productPrice)*productList[i].quantity)-coupon.offerPrice)
          resolve(price)
          }else{
            resolve('Minimum Price is '+coupon.minPrice+'/-')
          }
         

        }else{
          resolve('This coupon is not valid')
        }
        // console.log('hello bro',JSON.stringify(productList,null,2))
        // console.log(coupon,'hello \n',productList[i].product.sellerId)
      }

      }else{
        resolve('This coupon is expired')
      }
    
     

    }else{
      resolve('Coupon not found')
    }
  })
},
 getAllUsers:(sellerId)=>{
    return new Promise(async(resolve,reject)=>{
      let orders =await db.get().collection(collections.ORDER_COLLECTION).aggregate([
        // {
        //   $match:{sellerId:sellerId}
        // },
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
        },
        // {
        //   $lookup:{
        //     from:collections.PRODUCT_COLLECTION,
        //     localField:'products.item',
        //     foreignField:'_id',
        //     as:'product'
        //   }
        // },
        {
          $match:{'product.sellerId':sellerId}
        }

      ]).toArray()
      console.log('resolvieng orders testing : '+orders[0].product[0].productName)
      resolve(orders)
    })
  },
  approveSeller:(adminId)=>{
return new Promise(async(resolve,reject)=>{
  db.get().collection(collections.ADMIN_COLLECTION)
  .updateOne({_id:objectId(adminId)},
  {
    $set:{role:'seller'}
  }

).then(()=>{
  console.log("role changed to seller")
  resolve()
})
})
  },
  rejectSeller:(adminId)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collections.ADMIN_COLLECTION)
      .deleteOne({_id:objectId(adminId)}).then(()=>{
        console.log("Deleted seller from admin collections")
        resolve();
      })
    })
  },
  revokeSeller:(adminId)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collections.ADMIN_COLLECTION)
      .updateOne({_id:objectId(adminId)},
    {
      $set:{suspend:false}
    }).then(()=>{
      console.log("Seller revoked from database");
      resolve();
    })
    })
  },
  removeSeller:(adminId)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collections.ADMIN_COLLECTION)
      .deleteOne({_id:objectId(adminId)}).then(()=>{
        console.log("Seller Delted from admin collecitons")
        resolve();
      })
    })
  },
  removeSellerProducts:(adminId)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collections.PRODUCT_COLLECTION)
      .deleteMany({_id:objectId(adminId)}).then(()=>{
        console.log("deleted seller products")
        resolve()
      })
    })
  },
  suspendSeller:(adminId)=>{
    let suspendUntilDate=new Date()
     suspendUntilDate.setDate(suspendUntilDate.getDate()+2);
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collections.ADMIN_COLLECTION)
      .updateOne({_id:objectId(adminId)},
    {
      $set:{
        suspend:true,
        suspendUntil:suspendUntilDate,

      }
    }).then(()=>{
      // const cron=require('node-cron');
      // const datetime=new Date();
      // const adjustedDatetime=datetime.setDate(datetime.setDate()+2);
      // const eventDatetimeObject=new Date(adjustedDatetime);

      // cron.schedule(eventDatetimeObject,()=>{
      //   revokeSeller(adminId);
      // })
      console.log("Seller suspended")
      resolve()
    })
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