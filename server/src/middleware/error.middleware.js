export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let status = Number(error.statusCode || error.status || (res.statusCode >= 400 ? res.statusCode : 500));
  if (error?.type === "entity.parse.failed") status = 400;
  if (error?.name === "ValidationError") status = 400;
  if (error?.code === 11000) status = 409;
  if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;

  const isProduction = process.env.NODE_ENV === "production";
  if (status >= 500) {
    console.error("API error:", {
      method: req.method,
      path: req.path,
      message: error.message,
      name: error.name,
    });
  } else if (!isProduction) {
    console.warn("Request rejected:", req.method, req.path, error.message);
  }

  const message = status >= 500 && isProduction
    ? "An unexpected server error occurred. Please try again."
    : status === 409 && error?.code === 11000
      ? "A record with these details already exists."
      : error.message || "Request failed";

  res.status(status).json({ success: false, message });
};
