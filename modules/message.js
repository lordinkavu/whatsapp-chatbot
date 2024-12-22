import mongoose from "mongoose";
import Message from "../models/Message.js";

export const createMessage = async (
  userId,
  messageId,
  messageType,
  content,
  role,
  replyTo,
  conversationId
) => {
  return await Message.create({
    user: new mongoose.Types.ObjectId(userId),
    waId: messageId,
    type: messageType,
    content,
    role,
    replyTo: new mongoose.Types.ObjectId(replyTo),
    conversation: new mongoose.Types.ObjectId(conversationId),
  });
};

export const getMessageByWaId = async (waId) => {
  return await Message.findOne({ waId }).populate("replyTo");
};

export const updateMessage = async (messageId, data) => {
  return await Message.findByIdAndUpdate(messageId, data);
};

export const getMessagesByConversation = async (conversationId) => {
  return await Message.find({
    conversation: new mongoose.Types.ObjectId(conversationId),
  }).sort({ createdAt: 1 });
};

// count messages in the last 24 hours
export const getDayMessages = async (userId) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return await Message.countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: dayAgo },
    role: "user",
  });
};
