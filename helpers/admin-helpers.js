var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')

module.exports={

doLogin:(adminData)=>{
    return new Promise(async(resolve,reject)=>{
    let loginstatus = false;
    let response = {}

    let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({username:adminData.username})
    console.log(admin)
    if(admin){
         bcrypt.compare(adminData.Password,admin.password).then((adminStatus)=>{
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
        sellerData.Password=await bcrypt.hash(sellerData.Password,10)
        db.get().collection(collections.ADMIN_COLLECTION).insertOne(sellerData).then(data => resolve(data.insertedId))
        
        console.log(sellerData)
    })
}

}