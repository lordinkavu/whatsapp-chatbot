import crypto from "crypto";
import express from "express";
import { createUser, getUserByWaId } from "../modules/user.js";
import { processMessage } from "../utilities/processMessage.js";
import { sendOnboardingMessage } from "../utilities/sendMessage.js";

const router = express.Router();

// Add this function at the top of your file
function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  const expectedSignature = crypto
    .createHmac("sha256", process.env.CLOUD_API_APP_SECRET)
    .update(req.rawBody)
    .digest("hex");
  return `sha256=${expectedSignature}` === signature;
}

router.get("/", async (req, res) => {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == process.env.CLOUD_API_VERIFICATION_TOKEN
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
});

router.post("/", async (req, res) => {
  if (!verifySignature(req)) {
    return res.sendStatus(401);
  }
  const body = req.body;

  if (
    body.object === "whatsapp_business_account" &&
    body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  ) {
    try {
      const entry = body.entry[0];

      const changes = entry.changes[0];
      const value = changes.value;

      const message = value.messages[0];
      const contacts = value.contacts;
      const metadata = value.metadata;

      if (metadata.phone_number_id !== process.env.CLOUD_API_PHONE_NUMBER_ID) {
        return res.sendStatus(200);
      }

      const user = await getUserByWaId(message.from);

      if (!user) {
        const contact = contacts.find(
          (contact) => contact.wa_id === message.from
        );
        await createUser(contact.profile.name, contact.wa_id);
        await sendOnboardingMessage(message.from, contact.profile.name);
        return res.sendStatus(200);
      }

      await processMessage(message, user);

      return res.sendStatus(200);
    } catch (error) {
      console.error("Error processing WhatsApp message:", error);
      return res.sendStatus(500);
    }
  }

  return res.sendStatus(404);
});

export default router;

// Sample body
// {
//   "object": "whatsapp_business_account",
//   "entry": [
//     {
//       "id": "353914334477674",
//       "changes": [
//         {
//           "value": {
//             "messaging_product": "whatsapp",
//             "metadata": {
//               "display_phone_number": "14253411578",
//               "phone_number_id": "367526956448193"
//             },
//             "contacts": [
//               {
//                 "profile": {
//                   "name": "Gautham"
//                 },
//                 "wa_id": "919995803474"
//               }
//             ],
//             "messages": [
//               {
//                 "from": "919995803474",
//                 "id": "wamid.HBgMOTE5OTk1ODAzNDc0FQIAEhgUM0EyNTdDRjI2Qjc4NjQzOUEyODYA",
//                 "timestamp": "1720927645",
//                 "text": {
//                   "body": "Hi"
//                 },
//                 "type": "text"
//               }
//             ]
//           },
//           "field": "messages"
//         }
//       ]
//     }
//   ]
// }
