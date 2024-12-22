import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, required: true },
    content: { type: String },
    waId: { type: String, required: true },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    role: { type: String, required: true, enum: ["user", "ai"] },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
