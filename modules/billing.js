import axios from "axios";
import User from "../models/User.js";

export const createCheckoutSession = async (userId) => {
  try {
    const response = await axios.post(
      "https://api.lemonsqueezy.com/v1/checkouts",
      {
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              custom: {
                user_id: userId,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: process.env.LEMONSQUEEZY_STORE_ID,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: process.env.LEMONSQUEEZY_VARIANT_ID,
              },
            },
          },
        },
      },
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        },
      }
    );

    return response.data.data.attributes.url;
  } catch (error) {
    console.error("Error creating checkout session:", error.response.data);
    throw error;
  }
};

export const getCustomerPortalUrl = async (subscriptionId) => {
  try {
    const response = await axios.get(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        },
      }
    );
    return response.data.data.attributes.urls.customer_portal;
  } catch (error) {
    console.error("Error getting customer portal URL:", error?.response?.data);
    throw error;
  }
};

export const upgradeUser = async (id, subscriptionId) => {
  await User.findByIdAndUpdate(id, {
    plan: {
      type: "pro",
      subscriptionId: subscriptionId,
    },
  });
};

export const addExpirationDate = async (subscriptionId, expiresAt) => {
  console.log(
    "🚀 ~ addExpirationDate ~ subscriptionId, expiresAt:",
    subscriptionId,
    expiresAt
  );
  const user = await User.findOneAndUpdate(
    { "plan.subscriptionId": subscriptionId },
    {
      "plan.expiresAt": new Date(expiresAt),
    },
    {
      new: true,
    }
  );
  console.log("🚀 ~ addExpirationDate ~ user:", user);
};

export const downgradeUser = async (subscriptionId) => {
  await User.findOneAndUpdate(
    { "plan.subscriptionId": subscriptionId },
    {
      plan: {
        type: "free",
      },
    }
  );
};
