import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt"; //for hashing password
import jwt from "jsonwebtoken";
//CREATING A USER SCHEMA
const userSchema = new Schema(
    {
        username: {
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index : true,
        },
        email: {
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        },
        fullname: {
        type:String,
        required: true,
        trim: true,
        index: true,
        },
        avatar: {
        type:String, //cloud url
        required: true,
        },
         coverImage: {
        type:String, //cloud url
        },
        watchHistory: [
            { type: Schema.Types.ObjectId,
                ref: "Video" 
            }
        ],
        password:{
            type:String,
            required: [true, "password is required"]

        },
        refreshToken :{
            type:String,
        },


    },
    {
        timestamps: true,
        // versionKey: false,
    }
)
userSchema.pre("save" , async function(next){
    //enccrypt password before saving
    if(!this.ismodified("password")) {
        return next() //if password is not modified, skip hashing
    }
    this.password = bcrypt.hash(this.password,10) //10 is the salt rounds


    next()
})

//bcrpypt compare method 
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

//generating access token
userSchema.methods.generateAccessToken = function(){
    //short lived access token
   return jwt.sign({
        _id:this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET, //secret key for access token
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    },
);
}
//generating access token
userSchema.methods.generateRefreshToken = function(){
    //short lived access token
   return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET, //secret key for access token
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    },
);
}

        




export const User = mongoose.model("User", userSchema);