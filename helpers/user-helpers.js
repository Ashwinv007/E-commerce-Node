var db=require('../config/connection')
var collection=require('../config/collections.js')
const bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectId

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,10)

        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(data => resolve(data.insertedId))
        console.log(userData)

        })

    },
    doLogin:(userData)=>{
        let loginStatus=false
        let response={}
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
                if(user){
                    bcrypt.compare(userData.Password,user.Password).then((status)=>{
                                if(status){
                                    console.log('login sucess')
                                    response.user=user
                                    response.status=true
                                    resolve(response)

                                }else{
                                                        console.log('login failed')
                                                        resolve({status:false})

                                }
                    })
                }else{
                    console.log('no  email found')
                     resolve({status:false})

                }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let prodExist=userCart.products.findIndex(product=> product.item==proId)
                if(prodExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ user:objectId(userId),'products.item':objectId(proId) },
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve()
                })
                }else[
  db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                        $push:{products:proObj}
                    }
                ).then((response)=>{
                        resolve()
                    })
                ]
                
                  
                
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:"product"
                }
           
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{prodList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id',"$$prodList"]
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'

                //     }
                // }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            
            if(cart){
                cart.products.forEach((product)=>{
                        count+=product.quantity
                })
            }
                            resolve(count)

        })
    },
    changeProductQuantity:({details})=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
            ).then((response)=>{
                resolve(true)

            }
            )
            }
              
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
   let  total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            },
            {
                $group:{
                                _id:null,
                                total:{$sum:{$multiply:['$quantity',{$toDouble:'$product.productPrice'}]}}
                            }
            }
         
        ]).toArray()
        if(!total || total.lenght===0 || total[0].total===undefined){
            resolve(0)

        }else{
            resolve(total[0].total)
        }
        resolve(total[0].total)
        }
     
    )
    }

}