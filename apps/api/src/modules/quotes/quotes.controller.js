const asyncHandler = require("../../utils/asyncHandler");
const quotesService = require("./quotes.service");

const getDailyQuote = asyncHandler(async (req, res) => {
  const quote = await quotesService.getDailyQuote();

  res.status(200).json({
    success: true,
    message: "Daily quote fetched successfully",
    data: {
      quote,
    },
  });
});

module.exports = {
  getDailyQuote,
};