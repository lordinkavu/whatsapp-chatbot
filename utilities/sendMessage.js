import axios from "axios";
import { generateJournalingPrompt } from "./transformMessage.js";
import jwt from "jsonwebtoken";

import {
  getCustomerPortalUrl,
  createCheckoutSession,
} from "../modules/billing.js";

const phoneNumberId = process.env.CLOUD_API_PHONE_NUMBER_ID;

const POST = (data) => {
  return axios.post(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    data,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const sendOnboardingMessage = async (to, name) => {
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: `_Hi ${
        name || "there"
      }, I'm Joey from Whatsmemo, your personal AI journaling companion, available 24/7 👋_

You can write or record 🎙️ your thoughts and I'll respond. 

Let's start journaling! What's on your mind today?
`,
    },
  };
  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendHelpMessage = async (to) => {
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: `*Need help with Whatsmemo?* 

Here's a quick guide to using our service:

📝 Simply type your thoughts to add to your latest entry
🎙️ Send a voice note for audio journaling

*Available commands*:

⚡️ upgrade - Upgrade to Whatsmemo Pro
❌ cancel - Cancel your subscription
💳 billing - Manage your billing settings
🛠️ manage - Manage your account details, update language, etc
❓ help - Show this help message


If you have any questions, please feel free to reach out to hi@whatsmemo.com.

Happy journaling! 📝`,
    },
  };
  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendManageMessage = async (to, user) => {
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ user }, secret, { expiresIn: "30d" });
  const managementUrl = `https://app.whatsmemo.com/account/${token}`;
  // console.log(`http://localhost:5173/account/${token}`);
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: {
        text: `
        *Whatsmemo settings*

Click the button below to manage your account settings.
        `,
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: "Account settings",
          url: managementUrl,
        },
      },
    },
  };

  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendResponseMessage = async (
  to,
  message,
  replyTo,
  create = true
) => {
  const chunks = message.length > 1000 ? splitMessage(message) : [message];
  let response;

  for (let i = 0; i < chunks.length; i++) {
    const data = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: chunks[i],
      },
    };

    if (i === 0 && replyTo) {
      data.context = {
        message_id: replyTo,
      };
    }

    if (i === chunks.length - 1 && create) {
      data.type = "interactive";
      data.interactive = {
        type: "list",
        body: {
          text: chunks[i],
        },
        action: {
          button: "Share as",
          sections: [
            {
              rows: [
                {
                  id: "summary",
                  title: "Summary",
                },
                {
                  id: "action-items",
                  title: "Action items",
                },
                {
                  id: "bullet-points",
                  title: "Key points",
                },
                {
                  id: "tweet",
                  title: "Tweet",
                },
                {
                  id: "email",
                  title: "Email",
                },
              ],
            },
          ],
        },
      };
    }

    try {
      response = await POST(data);
    } catch (error) {
      console.error(
        "Error sending WhatsApp message:",
        error.response?.data || error.message
      );
    }
  }

  return response.data;
};

export const sendConversationMessage = async (to, message) => {
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: message,
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "end",
              title: "End chat",
            },
          },
        ],
      },
    },
  };
  const response = await POST(data);
  return response.data;
};

export const sendStartConversationMessage = async (to) => {
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "Do you want to start a conversation to explore your thoughts? 💭\n_Tip: You can use voice notes during the conversation._",
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "start",
              title: "Start conversation",
            },
          },
        ],
      },
    },
  };
  try {
    const response = await POST(data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendEndConversationMessage = async (to, conversationId) => {
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
  };
  try {
    const response = await POST(data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendPromptMessage = async (to) => {
  const prompt = await generateJournalingPrompt();
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: prompt,
    },
  };
  try {
    const response = await POST(data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendErrorMessage = async (to) => {
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: "Sorry, something went wrong. Please try again later. If issue persists, please contact support at hi@whatsmemo.com",
    },
  };
  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

const splitMessage = (message, maxLength = 1000) => {
  const paragraphs = message.split(/\n{2,}/);
  return paragraphs.flatMap((paragraph) => {
    if (paragraph.length <= maxLength) {
      return [paragraph];
    }
    return paragraph.match(new RegExp(`.{1,${maxLength}}`, "g")) || [];
  });
};

export const sendLimitExceededMessage = async (to, userId) => {
  const checkoutSessionUrl = await createCheckoutSession(userId);
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: {
        text: `
        *Limit exceeded*

You've reached the daily limit. _Upgrade to Pro for unlimited messages._
        `,
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: "Upgrade to Pro",
          url: checkoutSessionUrl,
        },
      },
    },
  };
  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendFileLimitExceededMessage = async (to) => {
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: "Sorry, we can only process short audio files. Please try again with a smaller file.",
    },
  };
  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendUpgradeMessage = async (to, userId) => {
  const checkoutSessionUrl = await createCheckoutSession(userId);
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: {
        text: `
        *Upgrade to Pro*

Click the button below to upgrade to Whatsmemo Pro.
        `,
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: "Upgrade to Pro",
          url: checkoutSessionUrl,
        },
      },
    },
  };
  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};

export const sendCustomerPortalMessage = async (to, subscriptionId) => {
  const customerPortalUrl = await getCustomerPortalUrl(subscriptionId);
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: {
        text: `
        *Customer portal*

Click the button below to manage your billing settings.
        `,
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: "Customer portal",
          url: customerPortalUrl,
        },
      },
    },
  };
  try {
    await POST(data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response?.data || error.message
    );
  }
};
