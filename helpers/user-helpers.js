var db = require('../config/connection')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
var instance = new Razorpay({ key_id: 'rzp_test_KuRfDd0Fixd4Cj', key_secret: 'pClROqLO4CwQ5N5IjCT7KjqB' })
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then(data => resolve(data.insertedId))
            console.log(userData)

        })

    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
        let loginstatus = false;
        let response = {}

        let user = await db.get().collection(collections.USER_COLLECTION).findOne({username:userData.username})
        if(user){
             bcrypt.compare(userData.Password,user.Password).then((status)=>{
                if(status){
                                    console.log('login sucess')
                                    response.user=user
                                    response.status=true
                                    resolve(response)


                }else{
                    console.log('Invalid PAssword')
                    resolve({status:false})

                }
             })
        }else{
            console.log('user not found')
            resolve({status:false})
        }

    })
    },

    addToCart:(proId,userId)=>{
        let proObj = {
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product =>product.item==proId)
                console.log(proExist)
                if(proExist!=-1){
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                    
                }else{
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                        $push:{products:proObj}
                    }
                    ).then((response)=>{
                        resolve()
                    })

                }
               
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
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
                        from: collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            
                
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                cart.products.forEach((product) => {
                    count += product.quantity;
                  });

                // count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise(async(resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                
                {
                    $pull:{'products':{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart), 'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
                ).then(()=>{
                    resolve({status:true})
                })

            }
         
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
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
                        from: collections.PRODUCT_COLLECTION,
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
                        total:{$sum:{$multiply: ['$quantity',{ $toDouble: '$product.productPrice' }]}}
                    }
                }
                
            ]).toArray()
            console.log(total)
            if (!total || total.length === 0 || total[0].total === undefined) {
                resolve(0); // Resolve with 0 if total is undefined or empty
            } else {
                console.log(total);
                resolve(total[0].total);
            }

            resolve(total[0].total)
        })
        
        

    },
    placeOrder:(order,products,total,reOrderStatus,reOrderId)=>{
        return new Promise(async(resolve,reject)=>{
            let status = order['payment-method']==='COD'?'placed':'pending'
            let cancelOrder= false;
            let productDelivered = false;
            if(status === 'placed'){
                 cancelOrder = true;
            }else if(status === 'pending'){
                cancelOrder = false;
            }else{
                 productDelivered = true;
            }
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode,
                    location:{
                        placed:true,
                        confirmed:false,
                        packed:false,
                        warehouse:false,
                        courier:false,
                        outForDelivery:false,
                        delivered:false,
                        current1:true,
                        current2:false,
                        current3:false,
                        current4:false,
                        current5:false,
                        current6:false,
                        current7:false,

                    },

                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                userAction:cancelOrder,
                productDelivered:productDelivered,
                date:new Date()

            }

            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                if(reOrderStatus){
                    console.log('reOrder true', reOrderId)
                     db.get().collection(collections.ORDER_COLLECTION).deleteOne(
                        { _id: objectId(reOrderId) })
                }else{
                    console.log('false rorder')
                    db.get().collection(collections.CART_COLLECTION).deleteOne({user:objectId(order.userId)})

                }
                // console.log("response: "+ response)
                // console.log("instertedId: "+response.insertedId)
                // console.log("id: "+response.insertedId._id)
               resolve(response.insertedId)
            })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId)
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(cart)
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId)
            let orders=await db.get().collection(collections.ORDER_COLLECTION)
            .find({userId:objectId(userId)}).toArray()
            console.log(orders)
            resolve(orders)
        })

    },
    cancelOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderCanceled = false
            console.log(orderId)
            try {
                await db.get().collection(collections.ORDER_COLLECTION).deleteOne(
                    { _id: objectId(orderId) },
                );orderCanceled = true
    
                if (orderCanceled) {
                    resolve({ removeOrder: true, message: 'Order cancelled successfully' });
                } else {
                    resolve({ removeOrder: false, message: 'Order not found or already cancelled' });
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    reOrderProducts: (reOrderId)=>{
        return new Promise(async(resolve, reject) =>{
            let orderDetails=await db.get().collection(collections.ORDER_COLLECTION)
            .find({_id:objectId(reOrderId)}).toArray()
            console.log('hi',orderDetails)
            resolve(orderDetails)
        })
    },
    trackOrderDetails: (orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let trackOrder = await db.get().collection(collections.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()
            // if (reOrderDetails && reOrderDetails.length > 0) {
            //     var firstProduct = reOrderDetails[0];
            //     if (firstProduct.deliveryDetails) {
            //       var address = firstProduct.deliveryDetails.address;
            //       var pincode = firstProduct.deliveryDetails.pincode;
            //       var mobile = firstProduct.deliveryDetails.mobile;
            //       var totalAmount = firstProduct.totalAmount;}
            resolve(trackOrder[0].deliveryDetails.location)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
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
                        from: collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)
        })
    },
    generateRazorpay:(orderId,total)=>{
        console.log('orderreceiptid: '+orderId)
        return new Promise(async(resolve,reject)=>{
            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: orderId,
              
              }, function(err,order){
                if(err){
                    console.log(err)
                }else{
                console.log("New order:"+ order)
                resolve(order)
                }
              })
        })


    }, 

    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256','pClROqLO4CwQ5N5IjCT7KjqB')

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            console.log("orderId is:"+details['payment[razorpay_order_id]']+" & "+"paymentid is :"+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            console.log(hmac)
            if(hmac==details['payment[razorpay_signature]']){
                console.log('resolved done')
                resolve()
            }else{
                console.log('some err in verifyoayemnt')
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            console.log(orderId)
            console.log('reached changepayemntstatus')
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            
            {
                $set:{userAction: true,
                    status:'placed'
            }            }
            ).then(()=>{
                console.log("done!")
                resolve()
            })

        })
    },
    findProducts:(searchTerm)=>{
        return new Promise(async(resolve,reject)=>{
          let product = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
          let matchingProducts = [];

          product.forEach(item => {
            console.log(product)
            console.log(item.productName)
            console.log(searchTerm)
            if (item.productName.toLowerCase().startsWith(searchTerm.toLowerCase())) {
              matchingProducts.push(item);
            }
          });
          console.log('///***///'+matchingProducts)

          resolve(matchingProducts)
    
    
    })
      },
}