const mongoClient = require('mongodb').MongoClient;
const state ={
    db:null
}

module.exports.connect = function(done){
    const url=process.env.MONGO_URI
    const dbname=process.env.DB_NAME

    mongoClient.connect(url,(err,client)=>{
        if(err) return done(err)
        state.db=client.db(dbname)
        done()
    })
    
}

module.exports.get = function(){
    return state.db
}