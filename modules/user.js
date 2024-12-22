import User from "../models/User.js";

export const getUserByWaId = async (waId) => {
  const user = await User.findOne({ waId });
  return user;
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  return user;
};

export const createUser = async (name, waId) => {
  const user = await User.create({
    name,
    waId,
  });
  return user;
};

export const updateUser = async (userId, data) => {
  const user = await User.findByIdAndUpdate(userId, data);
  return user;
};
