const {admin, storage, FieldValue} = require("../firebaseConfig");

const getAllClients = async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("clients").get();
    const clients = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(clients);
  } catch (error) {
    res.status(500).json({error: "Failed to fetch clients"});
  }
};

const createClient = async (req, res) => {
  try {
    const {name, logo, shortDescription, fullDescription, collaboration, impact, website} = req.body;
    if (!name) {
      return res.status(400).json({error: "Missing required field: name"});
    }

    let logoUrl = "";
    if (logo && logo.startsWith("data:image")) {
      const bucket = storage.bucket();
      const fileName = `clients/${Date.now()}_logo.jpg`;
      const file = bucket.file(fileName);
      const base64Data = logo.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "image/jpeg"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      logoUrl = url;
    }

    const docRef = await admin.firestore().collection("clients").add({
      name,
      logo: logoUrl,
      shortDescription: shortDescription || "",
      fullDescription: fullDescription || "",
      collaboration: collaboration || "",
      impact: impact || "",
      website: website || "",
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({id: docRef.id, message: "Client added"});
  } catch (error) {
    res.status(500).json({error: `Failed to add client: ${error.message}`});
  }
};

const updateClient = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, logo, shortDescription, fullDescription, collaboration, impact, website} = req.body;
    if (!name) {
      return res.status(400).json({error: "Missing required field: name"});
    }

    let logoUrl = logo;
    if (logo && logo.startsWith("data:image")) {
      const bucket = storage.bucket();
      const fileName = `clients/${Date.now()}_logo.jpg`;
      const file = bucket.file(fileName);
      const base64Data = logo.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      await file.save(buffer, {contentType: "image/jpeg"});
      const [url] = await file.getSignedUrl({action: "read", expires: "03-09-2491"});
      logoUrl = url;
    }

    await admin.firestore().collection("clients").doc(id).update({
      name,
      logo: logoUrl,
      shortDescription: shortDescription || "",
      fullDescription: fullDescription || "",
      collaboration: collaboration || "",
      impact: impact || "",
      website: website || "",
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({message: "Client updated"});
  } catch (error) {
    res.status(500).json({error: `Failed to update client: ${error.message}`});
  }
};

const deleteClient = async (req, res) => {
  try {
    const {id} = req.params;
    const docRef = admin.firestore().collection("clients").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({error: "Client not found"});
    }

    if (doc.data().logo) {
      try {
        const fileName = doc.data().logo.split("/").pop().split("?")[0];
        const filePath = `clients/${fileName}`;
        const file = storage.bucket().file(filePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Deleted logo: ${filePath}`);
        } else {
          console.warn(`Logo not found in Storage: ${filePath}`);
        }
      } catch (err) {
        console.error(`Failed to delete logo: ${err.message}`);
      }
    }

    await docRef.delete();
    res.json({message: "Client deleted"});
  } catch (error) {
    res.status(500).json({error: `Failed to delete client: ${error.message}`});
  }
};

module.exports = {getAllClients, createClient, updateClient, deleteClient};
