const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const serviceAccount = require("./serviceAccountKey.json");
const {FieldValue} = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "wyenfos-b7b96.firebasestorage.app",
});

const storage = admin.storage();
const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "https://wyenfos-b7b96.web.app", "https://us-central1-wyenfos-b7b96.cloudfunctions.net",
    "https://api-wyenfos-b7b96-us-central1.cloudfunctions.net"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({error: "Unauthorized: No token provided"});
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    await admin.auth().verifyIdToken(idToken);
    next();
  } catch (error) {
    res.status(401).json({error: `Unauthorized: Invalid token - ${error.message}`});
  }
};

// Team Routes
app.get("/team", async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("team").get();
    const team = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(team);
  } catch (error) {
    res.status(500).json({error: "Failed to fetch team members"});
  }
});

app.get("/team/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await admin.firestore().collection("team").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({error: "Team member not found"});
    }
    res.json({id: doc.id, ...doc.data()});
  } catch (error) {
    res.status(500).json({error: "Failed to fetch team member"});
  }
});

app.get("/public/team/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await admin.firestore().collection("team").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({error: "Team member not found"});
    }
    res.json({id: doc.id, ...doc.data()});
  } catch (error) {
    res.status(500).json({error: "Failed to fetch team member"});
  }
});

app.post("/team", authenticate, async (req, res) => {
  try {
    const {name, role, shortBio, fullBio, skills, achievements, video, employeeId, joiningDate, bloodGroup, profilePicture, status, resignationReason, terminationReason} = req.body;
    if (!name || !role || !employeeId || !joiningDate || !bloodGroup || !status) {
      return res.status(400).json({error: "Missing required fields"});
    }
    if (status === "Resigned" && !resignationReason) {
      return res.status(400).json({error: "Resignation reason required"});
    }
    if (status === "Terminated" && !terminationReason) {
      return res.status(400).json({error: "Termination reason required"});
    }

    let profilePictureUrl = "";
    if (profilePicture && profilePicture.startsWith("data:image")) {
      const bucket = storage.bucket();
      const fileName = `team/${Date.now()}_${employeeId}.jpg`;
      const file = bucket.file(fileName);
      const base64Data = profilePicture.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "image/jpeg"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      profilePictureUrl = url;
    }

    let qrCodeUrl = "";
    const docRef = await admin.firestore().collection("team").add({});
    try {
      const qrData = `https://wyenfos-b7b96.web.app/staff/${docRef.id}`;
      const bucket = storage.bucket();
      const qrFileName = `team/qr_${Date.now()}_${employeeId}.png`;
      const qrFile = bucket.file(qrFileName);
      const qrBuffer = await QRCode.toBuffer(qrData, {type: "png"});
      await qrFile.save(qrBuffer, {contentType: "image/png"});
      const [url] = await qrFile.getSignedUrl({action: "read", expires: "03-09-2491"});
      qrCodeUrl = url;
    } catch (error) {
      await docRef.delete();
      return res.status(500).json({error: `Failed to generate QR code: ${error.message}`});
    }

    await docRef.set({
      name,
      role,
      shortBio: shortBio || "",
      fullBio: fullBio || "",
      skills: skills || [],
      achievements: achievements || "",
      video: video || "",
      employeeId,
      joiningDate,
      bloodGroup,
      profilePicture: profilePictureUrl,
      qrCode: qrCodeUrl,
      status: status || "Currently Working",
      resignationReason: resignationReason || "",
      terminationReason: terminationReason || "",
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({id: docRef.id, message: "Team member added", qrCode: qrCodeUrl});
  } catch (error) {
    res.status(500).json({error: `Failed to add team member: ${error.message}`});
  }
});

app.put("/team/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const {name, role, shortBio, fullBio, skills, achievements, video, employeeId, joiningDate, bloodGroup, profilePicture, status, resignationReason, terminationReason} = req.body;
    if (!name || !role || !employeeId || !joiningDate || !bloodGroup || !status) {
      return res.status(400).json({error: "Missing required fields"});
    }
    if (status === "Resigned" && !resignationReason) {
      return res.status(400).json({error: "Resignation reason required"});
    }
    if (status === "Terminated" && !terminationReason) {
      return res.status(400).json({error: "Termination reason required"});
    }

    let profilePictureUrl = profilePicture;
    if (profilePicture && profilePicture.startsWith("data:image")) {
      const bucket = storage.bucket();
      const fileName = `team/${Date.now()}_${employeeId}.jpg`;
      const file = bucket.file(fileName);
      const base64Data = profilePicture.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "image/jpeg"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      profilePictureUrl = url;
    }

    let qrCodeUrl = "";
    try {
      const qrData = `https://wyenfos-b7b96.web.app/staff/${id}`;
      const bucket = storage.bucket();
      const qrFileName = `team/qr_${Date.now()}_${employeeId}.png`;
      const qrFile = bucket.file(qrFileName);
      const qrBuffer = await QRCode.toBuffer(qrData, {type: "png"});
      await qrFile.save(qrBuffer, {contentType: "image/png"});
      const [url] = await qrFile.getSignedUrl({action: "read", expires: "03-09-2491"});
      qrCodeUrl = url;
    } catch (error) {
      return res.status(500).json({error: `Failed to generate QR code: ${error.message}`});
    }

    await admin.firestore().collection("team").doc(id).update({
      name,
      role,
      shortBio: shortBio || "",
      fullBio: fullBio || "",
      skills: skills || [],
      achievements: achievements || "",
      video: video || "",
      employeeId,
      joiningDate,
      bloodGroup,
      profilePicture: profilePictureUrl,
      qrCode: qrCodeUrl,
      status: status || "Currently Working",
      resignationReason: resignationReason || "",
      terminationReason: terminationReason || "",
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({message: "Team member updated", qrCode: qrCodeUrl});
  } catch (error) {
    res.status(500).json({error: `Failed to update team member: ${error.message}`});
  }
});

app.delete("/team/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const doc = await admin.firestore().collection("team").doc(id).get();
    if (doc.exists) {
      if (doc.data().profilePicture) {
        const fileName = doc.data().profilePicture.split("/").pop().split("?")[0];
        await storage.bucket().file(`team/${fileName}`).delete().catch((err) => {
          console.error(`Failed to delete team profile picture: ${err.message}`);
        });
      }
      if (doc.data().qrCode) {
        const qrFileName = doc.data().qrCode.split("/").pop().split("?")[0];
        await storage.bucket().file(`team/${qrFileName}`).delete().catch((err) => {
          console.error(`Failed to delete team QR code: ${err.message}`);
        });
      }
    }
    await admin.firestore().collection("team").doc(id).delete();
    res.json({message: "Team member deleted"});
  } catch (error) {
    res.status(500).json({error: `Failed to delete team member: ${error.message}`});
  }
});

// Client Routes
app.get("/clients", async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("clients").get();
    const clients = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(clients);
  } catch (error) {
    res.status(500).json({error: "Failed to fetch clients"});
  }
});

app.post("/clients", authenticate, async (req, res) => {
  try {
    const {name, logo, shortDescription, fullDescription, collaboration, impact} = req.body;
    if (!name) {
      return res.status(400).json({error: "Missing required field: name"});
    }
    const docRef = await admin.firestore().collection("clients").add({
      name,
      logo: logo || "",
      shortDescription: shortDescription || "",
      fullDescription: fullDescription || "",
      collaboration: collaboration || "",
      impact: impact || "",
    });
    res.status(201).json({id: docRef.id, message: "Client added"});
  } catch (error) {
    res.status(500).json({error: `Failed to add client: ${error.message}`});
  }
});

app.put("/clients/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const {name, logo, shortDescription, fullDescription, collaboration, impact} = req.body;
    if (!name) {
      return res.status(400).json({error: "Missing required field: name"});
    }
    await admin.firestore().collection("clients").doc(id).update({
      name,
      logo: logo || "",
      shortDescription: shortDescription || "",
      fullDescription: fullDescription || "",
      collaboration: collaboration || "",
      impact: impact || "",
    });
    res.json({message: "Client updated"});
  } catch (error) {
    res.status(500).json({error: `Failed to update client: ${error.message}`});
  }
});

app.delete("/clients/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    await admin.firestore().collection("clients").doc(id).delete();
    res.json({message: "Client deleted"});
  } catch (error) {
    res.status(500).json({error: `Failed to delete client: ${error.message}`});
  }
});

// Internship Inquiry Routes
app.post("/internship-inquiries", async (req, res) => {
  try {
    const {name, email, message, role, status} = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({error: "Missing required fields"});
    }
    const docRef = await admin.firestore().collection("internship_inquiries").add({
      name,
      email,
      message,
      role: role || "Not specified",
      status: status || "Pending",
      timestamp: FieldValue.serverTimestamp(),
    });
    res.status(201).json({id: docRef.id, message: "Internship inquiry submitted"});
  } catch (error) {
    res.status(500).json({error: `Failed to submit internship inquiry: ${error.message}`});
  }
});

app.get("/internship-inquiries", authenticate, async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("internship_inquiries").orderBy("timestamp", "desc").get();
    const inquiries = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({error: `Failed to fetch internship inquiries: ${error.message}`});
  }
});

app.put("/internship-inquiries/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const {status} = req.body;
    if (!status) {
      return res.status(400).json({error: "Missing required field: status"});
    }
    await admin.firestore().collection("internship_inquiries").doc(id).update({status});
    res.json({message: `Internship inquiry ${status.toLowerCase()}`});
  } catch (error) {
    res.status(500).json({error: `Failed to update internship inquiry: ${error.message}`});
  }
});

// Contact Submission Routes
app.post("/contacts", async (req, res) => {
  try {
    const {name, email, phone, message} = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({error: "Missing required fields"});
    }
    const docRef = await admin.firestore().collection("contacts").add({
      name,
      email,
      phone: phone || "",
      message,
      timestamp: FieldValue.serverTimestamp(),
    });
    res.status(201).json({id: docRef.id, message: "Contact message submitted"});
  } catch (error) {
    res.status(500).json({error: `Failed to submit contact message: ${error.message}`});
  }
});

app.get("/contacts", authenticate, async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("contacts").get();
    const contacts = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(contacts);
  } catch (error) {
    res.status(500).json({error: `Failed to fetch contact submissions: ${error.message}`});
  }
});

app.put("/contacts/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const {name, email, message, phone} = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({error: "Missing required fields"});
    }
    await admin.firestore().collection("contacts").doc(id).update({
      name,
      email,
      message,
      phone: phone || "",
    });
    res.json({message: "Contact updated"});
  } catch (error) {
    res.status(500).json({error: `Failed to update contact: ${error.message}`});
  }
});

app.delete("/contacts/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    await admin.firestore().collection("contacts").doc(id).delete();
    res.json({message: "Contact deleted"});
  } catch (error) {
    res.status(500).json({error: `Failed to delete contact: ${error.message}`});
  }
});

// Advertisement Routes
app.get("/advertisements", async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("advertisements").orderBy("createdAt", "desc").get();
    const advertisements = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(advertisements);
  } catch (error) {
    res.status(500).json({error: `Failed to fetch advertisements: ${error.message}`});
  }
});

app.post("/advertisements", authenticate, async (req, res) => {
  try {
    const {title, image, video} = req.body;
    if (!title) {
      return res.status(400).json({error: "Missing required field: title"});
    }

    let imageUrl = "";
    if (image && image.startsWith("data:image")) {
      const bucket = storage.bucket();
      const fileName = `advertisements/${Date.now()}_image.jpg`;
      const file = bucket.file(fileName);
      const base64Data = image.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "image/jpeg"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      imageUrl = url;
    }

    let videoUrl = "";
    if (video && video.startsWith("data:video")) {
      const bucket = storage.bucket();
      const fileName = `advertisements/${Date.now()}_video.mp4`;
      const file = bucket.file(fileName);
      const base64Data = video.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "video/mp4"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      videoUrl = url;
    }

    const docRef = await admin.firestore().collection("advertisements").add({
      title,
      image: imageUrl,
      video: videoUrl,
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({id: docRef.id, message: "Advertisement added"});
  } catch (error) {
    res.status(500).json({error: `Failed to add advertisement: ${error.message}`});
  }
});

app.put("/advertisements/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const {title, image, video} = req.body;
    if (!title) {
      return res.status(400).json({error: "Missing required field: title"});
    }

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      const bucket = storage.bucket();
      const fileName = `advertisements/${Date.now()}_image.jpg`;
      const file = bucket.file(fileName);
      const base64Data = image.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "image/jpeg"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      imageUrl = url;
    }

    let videoUrl = video;
    if (video && video.startsWith("data:video")) {
      const bucket = storage.bucket();
      const fileName = `advertisements/${Date.now()}_video.mp4`;
      const file = bucket.file(fileName);
      const base64Data = video.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "video/mp4"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      videoUrl = url;
    }

    await admin.firestore().collection("advertisements").doc(id).update({
      title,
      image: imageUrl,
      video: videoUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({message: "Advertisement updated"});
  } catch (error) {
    res.status(500).json({error: `Failed to delete advertisement: ${error.message}`});
  }
});

app.delete("/advertisements/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const docRef = admin.firestore().collection("advertisements").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({error: "Advertisement not found"});
    }

    const data = doc.data();
    const deletionErrors = [];

    // Delete image from Storage if it exists
    if (data.image) {
      try {
        const fileName = data.image.split("/").pop().split("?")[0];
        const filePath = `advertisements/${fileName}`;
        const file = storage.bucket().file(filePath);
        // Check if file exists before attempting deletion
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Deleted image: ${filePath}`);
        } else {
          console.warn(`Image not found in Storage: ${filePath}`);
        }
      } catch (err) {
        console.error(`Failed to delete image: ${err.message}`);
        deletionErrors.push(`Image deletion failed: ${err.message}`);
      }
    }

    // Delete video from Storage if it exists
    if (data.video) {
      try {
        const fileName = data.video.split("/").pop().split("?")[0];
        const filePath = `advertisements/${fileName}`;
        const file = storage.bucket().file(filePath);
        // Check if file exists before attempting deletion
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Deleted video: ${filePath}`);
        } else {
          console.warn(`Video not found in Storage: ${filePath}`);
        }
      } catch (err) {
        console.error(`Failed to delete video: ${err.message}`);
        deletionErrors.push(`Video deletion failed: ${err.message}`);
      }
    }

    // Delete Firestore document
    await docRef.delete();
    console.log(`Deleted Firestore document: advertisements/${id}`);

    if (deletionErrors.length > 0) {
      return res.status(207).json({
        message: "Advertisement document deleted, but some files could not be deleted",
        errors: deletionErrors,
      });
    }

    res.json({message: "Advertisement deleted successfully"});
  } catch (error) {
    console.error(`Failed to delete advertisement: ${error.message}`);
    res.status(500).json({error: `Failed to delete advertisement: ${error.message}`});
  }
});

exports.api = functions.https.onRequest(app);
