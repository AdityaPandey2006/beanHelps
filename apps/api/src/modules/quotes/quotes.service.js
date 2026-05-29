const ApiError = require("../../utils/apiError");

const ZENQUOTES_TODAY_URL = "https://zenquotes.io/api/today";

const fallbackQuotes = [
  {
    quote: "Kindness is a quiet way to remind someone they are not alone.",
    author: "beanHelps",
  },
  {
    quote: "A gentle day is still a brave day.",
    author: "beanHelps",
  },
  {
    quote: "Healing often begins with one honest conversation.",
    author: "beanHelps",
  },
];

let cachedDailyQuote = null;

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const pickFallbackQuote = () => {
  const day = new Date().getDate();
  return fallbackQuotes[day % fallbackQuotes.length];
};

const getDailyQuote = async () => {
  const todayKey = getTodayKey();

  if (cachedDailyQuote?.dateKey === todayKey) {
    return cachedDailyQuote;
  }

  try {
    const response = await fetch(ZENQUOTES_TODAY_URL);

    if (!response.ok) {
      throw new ApiError(response.status, "Quote provider is unavailable");
    }

    const data = await response.json();
    const quote = data?.[0];

    if (!quote?.q) {
      throw new ApiError(502, "Quote provider returned an invalid response");
    }

    cachedDailyQuote = {
      dateKey: todayKey,
      quote: quote.q,
      author: quote.a || "Unknown",
      source: "ZenQuotes",
      attributionText: "Inspirational quotes provided by ZenQuotes API",
      attributionUrl: "https://zenquotes.io/",
    };

    return cachedDailyQuote;
  } catch {
    const fallback = pickFallbackQuote();

    cachedDailyQuote = {
      dateKey: todayKey,
      quote: fallback.quote,
      author: fallback.author,
      source: "beanHelps",
      attributionText: null,
      attributionUrl: null,
    };

    return cachedDailyQuote;
  }
};

module.exports = {
  getDailyQuote,
};