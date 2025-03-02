import cartModel from './cartModels.js'
import {model, Schema} from 'mongoose'

const userSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
    },
    email: {
        type: String,
        unique: true, 
        required: true
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    rol: {
        type: String,
        default: "User"
    },
    cart: {
        type: Schema.Types.ObjectId,
        ref: "carts"
    }
})

userSchema.post("save", async function (doc) {
    try {
        if(!doc.cart) { 
            const newCart = await cartModel.create({products: []})
            await model("users").findByIdAndUpdate(doc._id, {cart: newCart._id}) 
        }
    } catch (e) {
        console.log(e);
    }
})

const userModel = model("users", userSchema)

export default userModel