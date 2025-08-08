const {admin, transporter} = require("./firebaseConfig");
const crypto = require("crypto");

const requestPasswordChangeHandler = async (req, res) => {
  try {
    // Expect the email of the account to change and the new password from the request body
    const {emailToChange, newPassword} = req.body;

    // Validate required fields
    if (!emailToChange || !newPassword) {
      return res.status(400).json({error: "Email of account to change and new password are required."});
    }

    // --- Security Step: Identify the specific admin user whose password needs to be changed ---
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(emailToChange);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({error: `User with email '${emailToChange}' not found in Firebase Authentication.`});
      }
      console.error("Error fetching user by email for change request:", error);
      return res.status(500).json({error: `Failed to verify account to change: ${error.message}`});
    }

    const userId = userRecord.uid;

    // Generate a unique token for the verification link
    const token = crypto.randomBytes(20).toString("hex");
    const approvalUrl = `https://us-central1-wyenfos-b7b96.cloudfunctions.net/api/verify-change?token=${token}&userId=${userId}&type=password`;

    // Store the pending change request in Firestore
    await admin.firestore().collection("pendingChanges").doc(token).set({
      userId,
      newPassword,
      type: "password",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
      originalEmail: emailToChange,
    });

    // Configure mail options for sending the approval email
    const mailOptions = {
      from: "shajancl@gmail.com",
      to: "shajancl@gmail.com",
      subject: "Approve Admin Login Password Change Request",
      text: `A password change has been requested for the admin account: ${emailToChange}. Click here to confirm and approve the password change: ${approvalUrl}\nThis link is valid for 3 hours only.`,
      html: `<p>A password change has been requested for the admin login account: <b>${emailToChange}</b>.</p><p>Click here to confirm and approve the password change: <a href="${approvalUrl}">${approvalUrl}</a></p><p>This link is valid for 3 hours only.</p>`,
    };
    console.log("Mail Options:", JSON.stringify(mailOptions, null, 2));

    // Send the approval email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({message: "Confirmation email sent to default master admin email for approval. Check your inbox"});
  } catch (error) {
    console.error("Error in requestPasswordChangeHandler:", error);
    return res.status(500).json({error: `Failed to request password change: ${error.message}`});
  }
};

module.exports = {requestPasswordChangeHandler};
