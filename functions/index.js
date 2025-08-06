// const functions = require("firebase-functions");
// const express = require("express");
// const {setupMiddleware} = require("./middleware");
// const {setupTeamRoutes} = require("./routes/teamRoutes");
// const {setupClientRoutes} = require("./routes/clientRoutes");
// const {setupInternshipRoutes} = require("./routes/internshipRoutes");
// const {setupContactRoutes} = require("./routes/contactRoutes");
// const {setupAdvertisementRoutes} = require("./routes/advertisementRoutes");
// const {requestEmailChangeHandler} = require("./requestEmailChange");
// const {requestPasswordChangeHandler} = require("./requestPasswordChange");
// const {admin} = require("./firebaseConfig");
// const bcrypt = require("bcryptjs");

// // Initialize Express app
// const app = express();

// // Setup middleware (CORS, JSON body parsing)
// setupMiddleware(app);

// // Setup existing routes for various management sections
// setupTeamRoutes(app);
// setupClientRoutes(app);
// setupInternshipRoutes(app);
// setupContactRoutes(app);
// setupAdvertisementRoutes(app);

// // Add routes for email and password change requests
// app.post("/requestEmailChange", requestEmailChangeHandler);
// app.post("/requestPasswordChange", requestPasswordChangeHandler);

// // Add verification endpoint for email/password changes
// app.get("/verify-change", async (req, res) => {
//   const {token, userId, type} = req.query;

//   if (!token || !userId || !type) {
//     return res.status(400).json({error: "Missing required parameters in verification link."});
//   }

//   try {
//     const changeDoc = await admin.firestore().collection("pendingChanges").doc(token).get();

//     if (!changeDoc.exists || changeDoc.data().status !== "pending" || changeDoc.data().userId !== userId) {
//       return res.status(400).json({error: "Invalid or expired verification link."});
//     }

//     const {newEmail, newPassword} = changeDoc.data();

//     if (type === "email" && newEmail) {
//       await admin.auth().updateUser(userId, {email: newEmail});
//       await admin.firestore().collection("pendingChanges").doc(token).update({status: "approved"});
//       return res.status(200).json({message: "Email updated successfully. You can now log in with your new email."});
//     } else if (type === "password" && newPassword) {
//       // Use the plain text newPassword to update Firebase Auth
//       await admin.auth().updateUser(userId, {password: newPassword});
//       // Hash the password and update Firestore (for record-keeping, though not strictly necessary)
//       const hashedPassword = await bcrypt.hash(newPassword, 10);
//       await admin.firestore().collection("pendingChanges").doc(token).update({
//         status: "approved",
//         newPassword: hashedPassword, // Store hashed version post-verification
//       });
//       return res.status(200).json({message: "Password updated successfully. You can now log in with your new password."});
//     }

//     return res.status(400).json({error: "Invalid change type or missing data for the requested change."});
//   } catch (error) {
//     console.error("Verification error:", error);
//     await admin.firestore().collection("pendingChanges").doc(token).update({status: "failed"}).catch(console.error);
//     return res.status(500).json({error: `Verification failed: ${error.message}`});
//   }
// });

// // Export the main Express app as a Firebase Cloud Function
// exports.api = functions.https.onRequest(app);

const functions = require("firebase-functions");
const express = require("express");
const {setupMiddleware} = require("./middleware");
const {setupTeamRoutes} = require("./routes/teamRoutes");
const {setupClientRoutes} = require("./routes/clientRoutes");
const {setupInternshipRoutes} = require("./routes/internshipRoutes");
const {setupContactRoutes} = require("./routes/contactRoutes");
const {setupAdvertisementRoutes} = require("./routes/advertisementRoutes");
const {requestEmailChangeHandler} = require("./requestEmailChange");
const {requestPasswordChangeHandler} = require("./requestPasswordChange");
const {admin} = require("./firebaseConfig");
const bcrypt = require("bcryptjs");

// Initialize Express app
const app = express();

// Setup middleware (CORS, JSON body parsing)
setupMiddleware(app);

// Setup existing routes for various management sections
setupTeamRoutes(app);
setupClientRoutes(app);
setupInternshipRoutes(app);
setupContactRoutes(app);
setupAdvertisementRoutes(app);

// Add routes for email and password change requests
app.post("/requestEmailChange", requestEmailChangeHandler);
app.post("/requestPasswordChange", requestPasswordChangeHandler);

// Add verification endpoint for email/password changes
app.get("/verify-change", async (req, res) => {
  const {token, userId, type} = req.query;

  if (!token || !userId || !type) {
    return res.status(400).json({error: "Missing required parameters in verification link."});
  }

  try {
    const changeDoc = await admin.firestore().collection("pendingChanges").doc(token).get();

    if (!changeDoc.exists || changeDoc.data().status !== "pending" || changeDoc.data().userId !== userId) {
      return res.status(400).json({error: "Invalid or expired verification link."});
    }

    // Check if the link has expired (3 hours = 3 * 60 * 60 * 1000 milliseconds)
    const createdAt = changeDoc.data().createdAt.toDate();
    const now = new Date();
    const expirationTime = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    if (now - createdAt > expirationTime) {
      await admin.firestore().collection("pendingChanges").doc(token).update({status: "expired"});
      return res.status(400).json({error: "Verification link has expired (valid for 3 hours)."});
    }

    const {newEmail, newPassword} = changeDoc.data();

    if (type === "email" && newEmail) {
      await admin.auth().updateUser(userId, {email: newEmail});
      await admin.firestore().collection("pendingChanges").doc(token).update({status: "approved"});
      return res.status(200).json({message: "Email updated successfully. You can now log in with your new email."});
    } else if (type === "password" && newPassword) {
      await admin.auth().updateUser(userId, {password: newPassword});
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await admin.firestore().collection("pendingChanges").doc(token).update({
        status: "approved",
        newPassword: hashedPassword,
      });
      return res.status(200).json({message: "Password updated successfully. You can now log in with your new password."});
    }

    return res.status(400).json({error: "Invalid change type or missing data for the requested change."});
  } catch (error) {
    console.error("Verification error:", error);
    await admin.firestore().collection("pendingChanges").doc(token).update({status: "failed"}).catch(console.error);
    return res.status(500).json({error: `Verification failed: ${error.message}`});
  }
});

// Export the main Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
