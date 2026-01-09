var db = require('../config/connection')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const env=require("dotenv").config();
const nodemailer=require("nodemailer");
const productHelpers = require('./product-helpers');
var instance = new Razorpay({ key_id: 'rzp_test_KuRfDd0Fixd4Cj', key_secret: 'pClROqLO4CwQ5N5IjCT7KjqB' })
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then(data => resolve(data.insertedId))
            console.log(userData)

        })

    },
    verifyOTP:(enteredOtp,generatedOtp)=>{
        return new Promise(async(resolve,reject)=>{
            console.log('endterd otp: ',enteredOtp);
            console.log('genotp: ',generatedOtp)
            let response={}
             if(enteredOtp===generatedOtp){
                response.success=true
                resolve(response);
        }else{
            response.success=false
            resolve(response);
        }
        })
       


    },
    generateOTP:()=>{
        return new Promise(async(resolve,reject)=>{
           resolve(Math.floor(100000+Math.random()*900000).toString())
        })
         
    },
    changePassword:(userEmail,password)=>{
        return new Promise(async(resolve,reject)=>{
                    password=await bcrypt.hash(password,10)

            db.get().collection(collections.USER_COLLECTION)
            .updateOne({email:userEmail},
                {
                    $set:{Password:password}
                }
            )
            resolve()

        })
    },
    async sendVerificationEmail(email,otp){
        return new Promise(async(resolve,reject)=>{
  try{
            const transporter=nodemailer.createTransport({
                service:'gmail',
                port:587,
                secure:false,
                requireTLS:true,
                auth:{
                    user:process.env.NODEMAILER_USER,
                    pass:process.env.NODEMAILER_PASS    
                }
            })
            const info=await transporter.sendMail({
                from:process.env.NODEMAILER_USER,
                to:email,
                subject:"Verify your account",
                text:`Your OTP is ${otp}`,
                html:`<b>Your OTP: ${otp}<b>`,
            })
            resolve(info.accepted.length>0)
        }catch(err){
            console.log("Error sending email: ",err)
            return false;

        }
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
            let total = await module.exports.getTotalAmount(userId);
            let product = await productHelpers.findProduct(proId);
            let productPrice = parseFloat(product.productPrice);
    
            if (total + productPrice > 50000) {
                return resolve({ error: 'Cart limit of 50,000 exceeded' });
            }

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
                        resolve({status: true})
                    })
                    
                }else{
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                        $push:{products:proObj}
                    }
                    ).then((response)=>{
                        resolve({status: true})
                    })

                }
               
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve({status: true})
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
    getReviews:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            let reviews = await db.get().collection(collections.REVIEW_COLLECTION).aggregate([
                {
                    $match:{productId:proId}
                },
                {
                    $lookup:{
                        from: collections.USER_COLLECTION,
                        localField:'userId',
                        foreignField:'_id',
                        as:'user'
                    }
                },
                {
                    $unwind:'$user' // Unwind the user array created by $lookup
                },
                {
                    $project:{
                        _id:1,
                        productId:1,
                        userId:1,
                        ratingValue:1,
                        userReview:1,
                        date:1,
                        user: { name: '$user.username' }
                    }
                }
            ]).toArray()
            resolve(reviews)
        })
    },
    getRatingSummary:(proId,reviews)=>{
        return new Promise(async(resolve,reject)=>{
            const totalReviews=reviews.length;
            if (totalReviews === 0) {
                return resolve({
                    average: 0,
                    totalReviews: 0,
                    starCounts: {1:0, 2:0, 3:0, 4:0, 5:0},
                    starPercentages: {1:0, 2:0, 3:0, 4:0, 5:0},
                    starRows: [5,4,3,2,1].map(star => ({
                        star,
                        count: 0,
                        percentage: 0
                    }))
                });
            }
            let starCounts={1:0,2:0,3:0,4:0,5:0};
            reviews.forEach(r =>{
                let rating=parseInt(r.ratingValue,10);
                starCounts[rating]++;
            })

            const average=(
                (1*starCounts[1]+2*starCounts[2]+3*starCounts[3]+4*starCounts[4]+5*starCounts[5])/totalReviews

            ).toFixed(1);

            let starPercentages={};
            for(let i=1;i<=5;i++){
                starPercentages[i]=(starCounts[i]/totalReviews)*100;
            }
            let starRows=[5,4,3,2,1].map(star =>({
                star,
                count:starCounts[star],
                percentage:starPercentages[star]
            }))
            resolve({average,totalReviews,starCounts,starPercentages,starRows})

            
        })
    },
    checkReview:(userId,proId)=>{
        return new Promise(async(resolve,reject)=>{
            let review = await db.get().collection(collections.REVIEW_COLLECTION).aggregate([
                {
                    $match:{productId:proId, userId:objectId(userId)} // Match by product and user ID
                },
                {
                    $lookup:{
                        from: collections.USER_COLLECTION,
                        localField:'userId',
                        foreignField:'_id',
                        as:'user'
                    }
                },
                {
                    $unwind:'$user' // Unwind the user array created by $lookup
                },
                {
                    $project:{
                        _id:1,
                        productId:1,
                        userId:1,
                        ratingValue:1,
                        userReview:1,
                        date:1,
                        user: { name: '$user.username' }
                    }
                }
            ]).toArray()
            // findOne returns a single document, aggregate returns an array. Return the first element.
            resolve(review[0])
        })
    },
    hasUserOrderedProduct: (userId, productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const order = await db.get().collection(collections.ORDER_COLLECTION).findOne({
                    userId: objectId(userId),
                    status: 'placed',
                    'products.item': objectId(productId)
                });
                resolve(!!order); // Resolve with true if order is found, false otherwise
            } catch (err) {
                console.error("Error checking if user ordered product:", err);
                resolve(false); // Resolve with false in case of an error
            }
        });
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
    changeProductQuantity:(details, userId)=>{
        details.count=parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            let productIndex = cart.products.findIndex(product => product.item.toString() === details.product)
            let productInCart = cart.products[productIndex]
            let currentQuantity = productInCart.quantity

            // Get product price
            const productDetails = await productHelpers.findProduct(details.product);
            const productPrice = parseFloat(productDetails.productPrice);

            // Calculate potential new total if incrementing
            if (details.count === 1) { // Incrementing quantity
                let currentCartTotal = await module.exports.getTotalAmount(userId);
                let potentialNewTotal = currentCartTotal + productPrice;
                if (potentialNewTotal > 50000) {
                    return resolve({ error: 'Cart limit of 50,000 exceeded by adding this product' });
                }
            }
            // No limit check needed for decrementing

            if(details.count==-1 && currentQuantity==1){
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
    submitReview:(reviewData)=>{
        return new Promise(async(resolve,reject)=>{
            // Convert userId to ObjectId before inserting
            if (reviewData.userId) {
                reviewData.userId = objectId(reviewData.userId);
            }
            // Add current date to the review
            reviewData.date = new Date();
            db.get().collection(collections.REVIEW_COLLECTION).insertOne(reviewData).then(()=>{
                resolve()
            }).catch(reject) // Add catch to handle potential insert errors
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
            console.log("/n ********* total   "+ total)
            if (!total || total.length === 0 || total[0].total === undefined) {
                resolve(0); // Resolve with 0 if total is undefined or empty
            } else {
                console.log(total);
                resolve(total[0].total);
            }

            
        })
        
        

    },
    placeOrder: (order, products, total, reOrderStatus, reOrderId) => {
        return new Promise(async (resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            const productsBySeller = products.reduce((acc, cartItem) => {
                const sellerId = cartItem.product.sellerId.toString();
                if (!acc[sellerId]) {
                    acc[sellerId] = []
                }
                acc[sellerId].push(cartItem);
                return acc;
            }, {});

            const paymentGroupId = new objectId();
            let cancelOrder = status === 'placed';
            let productDelivered = false; // Assuming this is the default

            const ordersToInsert = Object.keys(productsBySeller).map(sellerId => {
                const sellerProducts = productsBySeller[sellerId];
                const sellerTotal = sellerProducts.reduce((sum, item) => {
                    const price = parseFloat(item.product.productPrice);
                    return sum + (item.quantity * price);
                }, 0);

                return {
                    paymentGroupId: paymentGroupId,
                    sellerId: objectId(sellerId),
                    userId: objectId(order.userId),
                    deliveryDetails: {
                        mobile: order.mobile,
                        address: order.address,
                        pincode: order.pincode,
                        trackOrder: {
                            ordered: {status:true, date: new Date()},
                            shipped: {status:false, date:null},
                            outForDelivery: {status:false, date:null},
                            delivered: {status:false, date:null},
                            stage_od: true,
                            stage_ship: false,
                            stage_oad: false,
                            stage_del: false,
                        },
                    },
                    paymentMethod: order['payment-method'],
                    products: sellerProducts.map(p => ({ item: objectId(p.item), quantity: p.quantity })),
                    totalAmount: sellerTotal,
                    status: status,
                    userAction: cancelOrder,
                    productDelivered: productDelivered,
                    date: new Date()
                };
            });

            try {
                await db.get().collection(collections.ORDER_COLLECTION).insertMany(ordersToInsert);

                if (reOrderStatus) {
                    console.log('reOrder true', reOrderId);
                    await db.get().collection(collections.ORDER_COLLECTION).deleteOne({ _id: objectId(reOrderId) });
                } else {
                    console.log('false rorder');
                    await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: objectId(order.userId) });
                }
                resolve(paymentGroupId);
            } catch (err) {
                reject(err);
            }
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
            let orders=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{userId:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'products.item',
                        foreignField:'_id',
                        as:'productDetails'
                    }
                },
                {
                    $unwind:'$productDetails'
                }
            ]).toArray()
            // .find({userId:objectId(userId)}).toArray()
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
            resolve(trackOrder[0].deliveryDetails.trackOrder)
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
                receipt: ""+orderId,
              
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
    changePaymentStatus: (paymentGroupId) => {
        return new Promise((resolve, reject) => {
            console.log(paymentGroupId)
            console.log('reached changepayemntstatus')
            db.get().collection(collections.ORDER_COLLECTION)
                .updateMany({ paymentGroupId: objectId(paymentGroupId) },
                    {
                        $set: {
                            userAction: true,
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    console.log("done!")
                    resolve()
                }).catch((err) => {
                    reject(err)
                })

        })
    },
    distributeAndRecordPayouts: (paymentGroupId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await db.get().collection(collections.ORDER_COLLECTION).find({ paymentGroupId: objectId(paymentGroupId) }).toArray();

                for (const order of orders) {
                    const totalAmount = order.totalAmount;
                    const platformFee = totalAmount * 0.10; // 10% platform fee
                    const sellerShare = totalAmount - platformFee;
                    const payoutStatus = 'PENDING';

                    await db.get().collection(collections.ORDER_COLLECTION).updateOne(
                        { _id: order._id },
                        {
                            $set: {
                                sellerShare: sellerShare,
                                platformFee: platformFee,
                                payoutStatus: payoutStatus
                            }
                        }
                    );
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
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