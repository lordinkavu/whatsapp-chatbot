import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    subscriptionId: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

const checkinSchema = new mongoose.Schema({
  time: String,
  message: String,
  localTime: String,
});

const userSchema = new mongoose.Schema(
  {
    waId: { type: String, required: true },
    name: String,
    email: String,
    plan: planSchema,
    language: String,
    about: String,
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    checkins: [checkinSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
