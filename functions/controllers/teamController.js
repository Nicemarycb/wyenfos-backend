const {admin, storage, FieldValue} = require("../firebaseConfig");
const QRCode = require("qrcode");

const getAllTeam = async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("team").get();
    const team = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(team);
  } catch (error) {
    res.status(500).json({error: "Failed to fetch team members"});
  }
};

const getTeamMember = async (req, res) => {
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
};

const getPublicTeamMember = async (req, res) => {
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
};

const createTeamMember = async (req, res) => {
  try {
    const {name, role, shortBio, fullBio, skills, achievements, video, employeeId, joiningDate, bloodGroup, profilePicture, status, resignationReason, terminationReason, quotes, emergencyPhone} = req.body;
    if (!name || !role || !employeeId || !joiningDate || !bloodGroup || !status) {
      return res.status(400).json({error: "Missing required fields"});
    }
    if (status === "Resigned" && !resignationReason) {
      return res.status(400).json({error: "Resignation reason required"});
    }
    if (status === "Terminated" && !terminationReason) {
      return res.status(400).json({error: "Termination reason required"});
    }
    // Validate emergency phone number
    if (emergencyPhone && !/^\+?[1-9]\d{1,14}$/.test(emergencyPhone)) {
      return res.status(400).json({error: "Invalid emergency phone number format. Use format like +1234567890."});
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

    let videoUrl = "";
    if (video && video.startsWith("data:video")) {
      const bucket = storage.bucket();
      const fileName = `team/video_${Date.now()}_${employeeId}.mp4`;
      const file = bucket.file(fileName);
      const base64Data = video.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "video/mp4"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      videoUrl = url;
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
      video: videoUrl || "",
      employeeId,
      joiningDate,
      bloodGroup,
      profilePicture: profilePictureUrl,
      qrCode: qrCodeUrl,
      status: status || "Currently Working",
      resignationReason: resignationReason || "",
      terminationReason: terminationReason || "",
      quotes: quotes || "",
      emergencyPhone: emergencyPhone || "",
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({id: docRef.id, message: "Team member added", qrCode: qrCodeUrl});
  } catch (error) {
    res.status(500).json({error: `Failed to add team member: ${error.message}`});
  }
};

const updateTeamMember = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, role, shortBio, fullBio, skills, achievements, video, employeeId, joiningDate, bloodGroup, profilePicture, status, resignationReason, terminationReason, quotes, emergencyPhone} = req.body;
    if (!name || !role || !employeeId || !joiningDate || !bloodGroup || !status) {
      return res.status(400).json({error: "Missing required fields"});
    }
    if (status === "Resigned" && !resignationReason) {
      return res.status(400).json({error: "Resignation reason required"});
    }
    if (status === "Terminated" && !terminationReason) {
      return res.status(400).json({error: "Termination reason required"});
    }
    // Validate emergency phone number
    if (emergencyPhone && !/^\+?[1-9]\d{1,14}$/.test(emergencyPhone)) {
      return res.status(400).json({error: "Invalid emergency phone number format. Use format like +1234567890."});
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

    let videoUrl = video;
    if (video && video.startsWith("data:video")) {
      const bucket = storage.bucket();
      const fileName = `team/video_${Date.now()}_${employeeId}.mp4`;
      const file = bucket.file(fileName);
      const base64Data = video.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "video/mp4"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      videoUrl = url;
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
      video: videoUrl || "",
      employeeId,
      joiningDate,
      bloodGroup,
      profilePicture: profilePictureUrl,
      qrCode: qrCodeUrl,
      status: status || "Currently Working",
      resignationReason: resignationReason || "",
      terminationReason: terminationReason || "",
      quotes: quotes || "",
      emergencyPhone: emergencyPhone || "",
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({message: "Team member updated", qrCode: qrCodeUrl});
  } catch (error) {
    res.status(500).json({error: `Failed to update team member: ${error.message}`});
  }
};

const deleteTeamMember = async (req, res) => {
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
      if (doc.data().video) {
        const fileName = doc.data().video.split("/").pop().split("?")[0];
        await storage.bucket().file(`team/${fileName}`).delete().catch((err) => {
          console.error(`Failed to delete team video: ${err.message}`);
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
};

module.exports = {getAllTeam, getTeamMember, getPublicTeamMember, createTeamMember, updateTeamMember, deleteTeamMember};
