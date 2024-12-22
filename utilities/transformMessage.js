import axios from "axios";
import {
  conversationPrompt,
  enhanceTranscriptionPrompt,
  generateActionItemsPrompt,
  generateBulletPointsPrompt,
  generateCheckInPrompt,
  generateEmailPrompt,
  generateEntryPrompt,
  generateSummaryPrompt,
  generateTitlePrompt,
  generateTweetPrompt,
  textMessagePrompt,
} from "../helpers/prompts.js";

export const transformTextMessage = async (text) => {
  const prompt = textMessagePrompt(text);
  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );

  const aiMessage = response.data.content[0].text;
  return aiMessage;
};

export const createFromTextMessage = async (text, type) => {
  let prompt;
  switch (type) {
    case "summary":
      prompt = generateSummaryPrompt(text);
      break;
    case "action-items":
      prompt = generateActionItemsPrompt(text);
      break;
    case "bullet-points":
      prompt = generateBulletPointsPrompt(text);
      break;
    case "tweet":
      prompt = generateTweetPrompt(text);
      break;
    case "email":
      prompt = generateEmailPrompt(text);
      break;
    default:
      throw new Error("Invalid type");
  }

  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );
  const aiMessage = response.data.content[0].text;
  return aiMessage;
};

export const generateJournalingPrompt = async () => {
  const journalPrompts = [
    "What's the best thing that happened to you today?",
    "If you could have any superpower, what would it be and why?",
    "What's your favorite childhood memory?",
    "If you could travel anywhere right now, where would you go?",
    "What's the funniest thing that happened to you this week?",
    "If you could have dinner with any fictional character, who would it be?",
    "What's your go-to song to lift your mood?",
    "Describe your ideal lazy Sunday.",
    "If you could instantly become an expert in one skill, what would it be?",
    "What's the best compliment you've ever received?",
    "If you could have a conversation with your pet, what would you ask them?",
    "What's your favorite way to relax after a long day?",
    "If you could invent something, what would it be?",
    "What's the most interesting dream you've had recently?",
  ];
  const randomPrompt =
    journalPrompts[Math.floor(Math.random() * journalPrompts.length)];

  const prompt = `Generate a single journaling prompt. It should be a concise question. Do not include any introductory text or explanations. Only provide the prompt itself. For reference, here's an example of the style and length I'm looking for: "${randomPrompt}"`;

  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );
  return response.data.content[0].text;
};

export const enhanceTranscription = async (transcription) => {
  const prompt = enhanceTranscriptionPrompt(transcription);
  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );
  return response.data.content[0].text;
};

function mergeAdjacentMessages(messages = []) {
  if (!messages || messages.length === 0)
    return [{ role: "user", content: "Hi" }];

  const result = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];
    const lastMergedMessage = result[result.length - 1];

    if (currentMessage.role === lastMergedMessage.role) {
      // Merge the content of the current message with the last merged message
      lastMergedMessage.content += "\n" + currentMessage.content;
    } else {
      // Add the current message as a new entry in the result array
      result.push(currentMessage);
    }
  }

  // Check if the first message is not from the user
  if (result?.[0].role !== "user") {
    result.unshift({ role: "user", content: "Hi" });
  }

  return result;
}

export const generateConversationMessage = async (previousMessages, user) => {
  const prompt = conversationPrompt(user);

  const processedMessages = mergeAdjacentMessages(
    previousMessages?.map((m) => ({
      role: m.role === "ai" ? "assistant" : m.role,
      content: m.content,
    }))
  );

  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    system: prompt,
    messages: processedMessages,
  };
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );

  return response.data.content[0].text;
};

export const generateJournalEntryFromConversation = async (messages) => {
  const prompt = generateEntryPrompt(messages);

  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );
  return response.data.content[0].text;
};

export const generateTitleFromJournal = async (messages) => {
  const prompt = generateTitlePrompt(messages);
  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );
  return response.data.content[0].text;
};

export const generateCheckInMessage = async (localTime) => {
  const prompt = generateCheckInPrompt(localTime);
  const requestBody = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );
  return response.data.content[0].text;
};
