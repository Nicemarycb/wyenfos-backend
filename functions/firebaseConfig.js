const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const nodemailer = require("nodemailer");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "wyenfos-b7b96.firebasestorage.app",
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "shajancl@gmail.com",
    // pass: "nkzb mnag abfn evzt", // Replace with new App Password
    pass: "fhtvwkxlilkvzjfy",
  },
});

const storage = admin.storage();
const FieldValue = admin.firestore.FieldValue;

module.exports = {admin, storage, FieldValue, transporter};
