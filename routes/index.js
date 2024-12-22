import express from "express";
import listenRoutes from "./listen.routes.js";
import userRoutes from "./user.routes.js";
import paymentRoutes from "./payment.routes.js";

const router = express.Router();

router.use("/listen", listenRoutes);
router.use("/user", userRoutes);
router.use("/payment", paymentRoutes);

export default router;
