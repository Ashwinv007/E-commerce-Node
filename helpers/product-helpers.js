var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')
// const imageThumbnail=require('image-thumbnail');
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
  
findProduct:(product_id)=>{
  console.log('pro id here:  ',product_id)
  return new Promise(async(resolve,reject)=>{
    let product=await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectId(product_id)})
    console.log('some pro  ',product)
    resolve(product)
    
  })
},

  getAllProductsBySeller:(sellerId)=>{
    console.log('get all pro',sellerId)
    return new Promise(async(resolve,reject)=>{
      let product = await db.get().collection(collections.PRODUCT_COLLECTION).find({sellerId:sellerId}).toArray()
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
  getAllProducts:()=>{
    console.log('get all pro',)
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
  getAllOrdersForAdmin:()=>{
    return new Promise(async(resolve,reject)=>{
      let orders = await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
      resolve(orders)
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

      let updateData = {
        productName:proDetails.productName,
        productDescription: proDetails.productDescription,
        productPrice: proDetails.productPrice,
        Category: proDetails.Category,
        stockAmount:proDetails.stockAmount
      };

      if (proDetails.extsRender) {
          updateData.extsRender = proDetails.extsRender;
      }

      db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
        $set: updateData
      }).then((response)=>{
        resolve()
      })
    })
    
  },
  decreaseStockQuantity:(product)=>{
    return new Promise(async(resolve,reject)=>{
      console.log('product here: ',product)
      console.log('product id here',product._id)
      let quantity=await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:product.item})
      let decreasedQuantity=quantity.stockAmount-product.quantity
      console.log('quantity here: ',quantity.stockAmount)
      db.get().collection(collections.PRODUCT_COLLECTION)
      .updateOne({_id:product.item},{
        $set:{
          stockAmount:decreasedQuantity
        }
      })
      resolve()
    })
  },
  // getSellerIdofProducts:(cartId)=>{
  //   return new Promise(async(resolve,reject)=>{
  //     let products=await db.get().collection(collections.CART_COLLECTION)
  //   })


  // },
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
      console.log('hey boy new thing here, '+orders[0])
      // console.log('users here:  '+ orders[0].user[0].username)
      resolve(orders)
    })
  },

  updateProductMedia: (productId, imageUrls, thumbnailUrl) => {
    return db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: objectId(productId) }, {
      $set: { 
        imageUrls: imageUrls, 
        thumbnailUrl: thumbnailUrl,
        extsRender: null // Clean up the old field
      }
    });
  },

}