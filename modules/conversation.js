import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

export const createConversation = async (userId) => {
  const conversation = await Conversation.create({
    user: new mongoose.Types.ObjectId(userId),
  });
  // assign the conversation to the user
  await User.findByIdAndUpdate(userId, {
    $set: { conversation: conversation._id },
  });

  return conversation;
};
