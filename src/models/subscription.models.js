import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //ONW WHO IS SUBSCRIBING 
        ref: "User",
        // required: true,
    },
    channel: {
        type: Schema.Types.ObjectId,//one to whom
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
}
);
export const Subscription = mongoose.model("Subscription", subscriptionSchema);