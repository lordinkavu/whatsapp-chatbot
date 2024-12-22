import mongoose from "mongoose";
async function connectDb() {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Database connection established"))
    .catch((err) => console.log(err));
}

connectDb();
