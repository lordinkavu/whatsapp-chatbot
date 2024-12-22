import axios from "axios";
import {
  createMessage,
  getDayMessages,
  getMessageByWaId,
  getMessagesByConversation,
} from "../modules/message.js";
import {
  createFromTextMessage,
  generateCheckInMessage,
  generateConversationMessage,
  generateJournalEntryFromConversation,
  generateTitleFromJournal,
} from "./transformMessage.js";
import {
  sendConversationMessage,
  sendCustomerPortalMessage,
  sendErrorMessage,
  sendFileLimitExceededMessage,
  sendHelpMessage,
  sendLimitExceededMessage,
  sendManageMessage,
  sendResponseMessage,
  sendUpgradeMessage,
} from "./sendMessage.js";

import FormData from "form-data";
import { createConversation } from "../modules/conversation.js";
import { updateUser } from "../modules/user.js";
import User from "../models/User.js";

const checkMessageLimit = async (userId, plan = "free") => {
  if (plan === "pro") return false;
  const messageCount = await getDayMessages(userId);
  if (messageCount > 50) {
    return true;
  }
  return false;
};

export const processMessage = async (message, user) => {
  try {
    const type = message.type;
    switch (type) {
      case "interactive":
        await processInteractiveMessage(message, user);
        break;
      case "audio":
      case "text": {
        await processTextMessage(message, user);
        break;
      }
      default:
        console.log(`Unsupported message type: ${type}`);
    }
  } catch (e) {
    if (e?.response?.data) {
      console.log("🚀 ~ processMessage ~ e.response.data:", e.response.data);
    } else console.error("Error processing message:", e);
    await sendErrorMessage(message.from);
  }
};

export const processInteractiveMessage = async (message, user) => {
  const inReplyTo = message.context.id;

  const interactionType = message.interactive.type;

  switch (interactionType) {
    case "list_reply":
      if (await checkMessageLimit(user._id, user.plan?.type)) {
        await sendLimitExceededMessage(message.from, user._id);
        return;
      }
      const action = message.interactive.list_reply.id;

      const contextMessage = await getMessageByWaId(inReplyTo);

      const aiResponse = await createFromTextMessage(
        contextMessage.content,
        action
      );

      await sendResponseMessage(
        message.from,
        aiResponse,
        contextMessage?.replyTo?.waId,
        false
      );
      break;

    case "button_reply":
      const buttonAction = message.interactive.button_reply.id;
      if (buttonAction === "end") {
        await updateUser(user._id, {
          conversation: null,
        });
        const messages = await getMessagesByConversation(user.conversation);

        const journalEntry = await generateJournalEntryFromConversation(
          messages.map((m) => `${m.role}: ${m.content}`).join("\n")
        );

        const title = await generateTitleFromJournal(journalEntry);
        const currentDate = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const formattedJournalEntry = `_${currentDate}_\n\n*${title}*\n\n${journalEntry}`;
        const aiMessage = await sendResponseMessage(
          message.from,
          formattedJournalEntry
        );
        await createMessage(
          user._id,
          aiMessage.messages[0].id,
          "text",
          journalEntry,
          "ai"
        );
      }
      break;
    default:
      console.log(`Unsupported interaction type: ${interactionType}`);
  }
};

export const processTextMessage = async (message, user) => {
  // Step 1: Save the message to the database
  const content =
    message.type === "text"
      ? message.text.body
      : message.type === "audio"
      ? await processAudioMessage(message, user)
      : "";

  if (!content) {
    await sendErrorMessage(message.from);
    return;
  }

  const commands = content?.toLowerCase();

  switch (commands) {
    case "help":
      await sendHelpMessage(message.from);
      return;
    case "manage":
      await sendManageMessage(message.from, user);
      return;
    case "upgrade":
    case "cancel":
    case "billing":
      return user.plan?.type === "pro"
        ? await sendCustomerPortalMessage(
            message.from,
            user.plan?.subscriptionId
          )
        : await sendUpgradeMessage(message.from, user._id);
    case "upsell":
      await sendLimitExceededMessage(message.from, user._id);
      return;
    default:
      break;
  }

  if (await checkMessageLimit(user._id, user.plan?.type)) {
    await sendLimitExceededMessage(message.from, user._id);
    return;
  }

  let conversationId =
    user.conversation || (await createConversation(user._id))._id;

  await createMessage(
    user._id,
    message.id,
    "text",
    content,
    "user",
    null,
    conversationId
  );

  await processConversation(message.from, conversationId, user);
};

export const processAudioMessage = async (message, user) => {
  if (await checkMessageLimit(user._id, user.plan?.type)) {
    return "upsell";
  }
  try {
    const audioId = message.audio.id;

    const { data: audioFile } = await axios.get(
      `https://graph.facebook.com/v20.0/${audioId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
        },
      }
    );

    const audioUrl = audioFile.url;
    const audioType = audioFile.mime_type;

    // Get file size in bytes
    const fileSize = audioFile.file_size;
    const fileSizeInMB = fileSize / 1024 / 1024;

    if (fileSizeInMB > 1.5) {
      // send message that the file size is too large
      await sendFileLimitExceededMessage(message.from);
      return;
    }
    const response = await axios.get(audioUrl, {
      headers: {
        Authorization: `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
      },
      responseType: "arraybuffer",
    });

    // Create a FormData object to send the buffer
    const formData = new FormData();

    formData.append("file", response.data, {
      filename: `audio.${audioType.split("/")[1]}`,
      contentType: audioType,
    });
    formData.append("model", "whisper-1");

    if (user.language) {
      formData.append("language", user.language);
    }

    const whisperResponse = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    const transcript = whisperResponse.data.text;
    return transcript;
  } catch (e) {
    if (e?.response?.data) {
      console.log(
        "🚀 ~ processAudioMessage ~ e.response.data:",
        e.response.data
      );
    }
  }
};

export const processConversation = async (from, conversationId, user) => {
  const previousMessages = await getMessagesByConversation(conversationId);

  try {
    const aiResponse = await generateConversationMessage(
      previousMessages,
      user
    );
    const aiMessage = await sendConversationMessage(from, aiResponse);

    await createMessage(
      user._id,
      aiMessage.messages[0].id,
      "text",
      aiResponse,
      "ai",
      null,
      conversationId
    );
  } catch (e) {
    console.log("🚀 ~ processConversation ~ e:", e?.response?.data || e);
  }
};

export async function processCheckIns() {
  const now = new Date();
  const currentTime = `${now.getUTCHours().toString().padStart(2, "0")}:${now
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;

  const users = await User.find({ "checkins.time": currentTime });

  console.log(
    "🚀 ~ processCheckIns ~ users:",
    currentTime,
    users?.map((u) => u.waId)
  );

  for (const user of users) {
    const checkin = user.checkins.find((c) => c.time === currentTime);
    if (checkin && user.waId) {
      try {
        const conversation = await createConversation(user._id);
        const checkInMessage = await generateCheckInMessage(checkin.localTime);
        const message = await sendResponseMessage(
          user.waId,
          checkInMessage,
          null,
          false
        );
        await createMessage(
          user._id,
          message.messages[0].id,
          "text",
          checkInMessage,
          "ai",
          null,
          conversation._id
        );
      } catch (e) {
        console.log("🚀 ~ processCheckIns ~ e:", e);
      }
    }
  }
}
