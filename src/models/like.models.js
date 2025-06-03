import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
    //either of video ,comment or tweet will be assigned others are null
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        // default: null,
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        // default: null,
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet",
        // default: null,
    },
    //user who liked the video/comment/tweet
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        // required: true,
    },

 
}, {
    timestamps: true,
})
export const Like = mongoose.model("Like", likeSchema);