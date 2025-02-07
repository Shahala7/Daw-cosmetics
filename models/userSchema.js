const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");
const userSchema = Mongoose.Schema({
    googleId:{
        type:Number
    },
        name: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'blocked'],
            default: 'active'
        },
        email: {
            type: String,
            required: true,
            unique: false
        },
        phone: {
            type: String,
            unique: true,  
          },
        password: {
            type: String,
    
        },
        createdOn: {
            type: String
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        isAdmin: {
            type: String,
            default: "0"
        },
       
        wishlist: {
            type: Array
        },
        wallet: {
            type: Number,
            default: 0
        },
        history: {
            type: Array
        },
        referalCode: {
            type: String,
            
        },
        redeemed: {
            type: Boolean,
            default: false,
        },
        redeemedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
                required: true,
            }
        ],
    });
    
    
    const User = Mongoose.model("User", userSchema);
    
    module.exports = User;