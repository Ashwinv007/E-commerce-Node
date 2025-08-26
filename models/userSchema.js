const mongoose = require("mongoose");   // CommonJS
const { Schema } = mongoose;

const userSchema = new Schema({
  name:{
    type:String,
    required:true,
  },
  email:{
    type:String,
    required:true,
    unique:true
  },
  phone:{
    type:String,
    required:false,
    unique:true,
    sparse:true,
    default:null
  },
  googleId:{
    type:String,
    unique:true
  },
  password:{
    type:String,
    required:false
  }
});

module.exports = mongoose.model("User", userSchema);
