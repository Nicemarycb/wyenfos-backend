
const cors = require("cors");
const {admin} = require("./firebaseConfig"); // Adjust path if necessary
const express = require("express");

// Function to set up common middleware for the Express app
const setupMiddleware = (app) => {
  // Configure CORS to allow requests from specific origins
  app.use(cors({
    origin: [
      "http://localhost:3000", // For local development
      "https://wyenfos-b7b96.web.app", // Your Firebase Hosting URL
      "https://wyenfosinfotech.com", // Your custom domain
      "https://us-central1-wyenfos-b7b96.cloudfunctions.net",
      "https://api-wyenfos-b7b96-us-central1.cloudfunctions.net",
      // "wyenfos-b7b96.firebasestorage.app"
      // Add any other necessary origins here
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed request headers
    credentials: true, // Allow sending cookies/auth headers
  }));
  app.use(express.json()); // Enable JSON body parsing for incoming requests
};

// Authentication middleware to verify Firebase ID tokens
const authenticate = async (req, res, next) => {
  // Bypass authentication for the /verify-change endpoint
  // This endpoint is accessed via email link and doesn't require a logged-in session token
  if (req.path === "/verify-change") return next();

  // Extract the Authorization header
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is missing or not in "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({error: "Unauthorized: No token provided or invalid format"});
  }

  // Extract the ID token from the header
  const idToken = authHeader.split("Bearer ")[1];

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach the decoded token to the request object for later use
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Token verification error:", error);
    // Return 401 if the token is invalid or expired
    res.status(401).json({error: `Unauthorized: Invalid token - ${error.message}`});
  }
};

module.exports = {setupMiddleware, authenticate};
