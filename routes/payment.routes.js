import { Router } from "express";
import { getUserById } from "../modules/user.js";
import {
  addExpirationDate,
  downgradeUser,
  upgradeUser,
} from "../modules/billing.js";

import crypto from "crypto";

const router = Router();

router.post("/", async (req, res) => {
  // Check for LemonSqueezy signing secret
  try {
    const signingSecret = process.env.LEMONSQUEEZY_SIGNING_SECRET;
    const signature = req.headers["x-signature"];

    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    const hmac = crypto.createHmac("sha256", signingSecret);
    const digest = hmac.update(req.rawBody).digest("hex");

    if (signature !== digest) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle LemonSqueezy subscription webhook
    const event = req.body;
    console.log("🚀 ~ router.post ~ event:", event);

    switch (event.meta.event_name) {
      case "subscription_created":
        // get userId from custom data
        const userId = event.meta.custom_data.user_id;
        const user = await getUserById(userId);

        if (!user) {
          return res.status(400).json({ error: "User not found" });
        }

        // Handle new subscription
        await upgradeUser(
          userId,
          event.data.id,
          event.data.attributes.user_email
        );

        break;
      case "subscription_cancelled":
        await addExpirationDate(event.data.id, event.data.attributes.ends_at);
        break;
      case "subscription_expired":
        await downgradeUser(event.data.id);
        break;
      default:
        console.log("Unhandled event:", event.event_name);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("🚀 ~ app.post ~ Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
