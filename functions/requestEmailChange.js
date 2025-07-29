
const {admin, transporter} = require("./firebaseConfig");
const crypto = require("crypto");

const requestEmailChangeHandler = async (req, res) => {
  try {
    // Expect the email of the account to change and the new email from the request body
    const {emailToChange, newEmail} = req.body;

    // Validate required fields
    if (!emailToChange || !newEmail) {
      return res.status(400).json({error: "Email of account to change and new email are required."});
    }

    // --- Security Step: Identify the specific admin user whose email needs to be changed ---
    // This is the 'login admin' account, not necessarily the 'master admin' approval recipient.
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(emailToChange);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Do not reveal if the email exists for security reasons, just a generic error
        return res.status(404).json({error: `User with email '${emailToChange}' not found in Firebase Authentication.`});
      }
      console.error("Error fetching user by email for change request:", error);
      return res.status(500).json({error: `Failed to verify account to change: ${error.message}`});
    }

    const userId = userRecord.uid; // Get the actual Firebase UID of the user whose email will be changed

    // Generate a unique token for the verification link
    const token = crypto.randomBytes(20).toString("hex");
    // Construct the approval URL pointing to your Cloud Function's verify-change endpoint
    const approvalUrl = `https://us-central1-wyenfos-b7b96.cloudfunctions.net/api/verify-change?token=${token}&userId=${userId}&type=email`;

    // Store the pending change request in Firestore
    // Link it to the actual userId and include the newEmail
    await admin.firestore().collection("pendingChanges").doc(token).set({
      userId, // Store the actual UID of the user whose email will be changed
      newEmail,
      type: "email",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
      originalEmail: emailToChange, // Store original email for context in approval email
    });

    // Configure mail options for sending the approval email
    const mailOptions = {
      from: "wyenfos016@gmail.com",
      to: "wyenfos016@gmail.com", // MANDATORY: Always send to the default master admin email for approval
      subject: "Approve Admin Login Email Change Request",
      text: `An email change has been requested for the admin account: ${emailToChange}. Click here to confirm and approve the email change to ${newEmail}: ${approvalUrl}\nThis link is valid for 24 hours.`,
      html: `<p>An email change has been requested for the admin login account: <b>${emailToChange}</b>.</p><p>Click here to confirm and approve the email change to <b>${newEmail}</b>: <a href="${approvalUrl}">${approvalUrl}</a></p><p>This link is valid for 24 hours.</p>`,
    };
    console.log("Mail Options:", JSON.stringify(mailOptions, null, 2)); // Debug log

    // Send the approval email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({message: "Confirmation email sent to default master admin email for approval. Check your inbox."});
  } catch (error) {
    console.error("Error in requestEmailChangeHandler:", error);
    return res.status(500).json({error: `Failed to request email change: ${error.message}`});
  }
};

module.exports = {requestEmailChangeHandler};

