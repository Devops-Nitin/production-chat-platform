import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    isGroup: {
      type: Boolean,
      default: true,
    },

    members: [
      {
        type: String,
        required: true,
      },
    ],

    admins: [
      {
        type: String,
        required: true,
      },
    ],

    createdBy: {
      type: String,
      required: true,
    },

    lastMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
