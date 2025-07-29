const {admin, storage, FieldValue} = require("../firebaseConfig");

const getAllAdvertisements = async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("advertisements").orderBy("createdAt", "desc").get();
    const advertisements = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(advertisements);
  } catch (error) {
    res.status(500).json({error: `Failed to fetch advertisements: ${error.message}`});
  }
};

const createAdvertisement = async (req, res) => {
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
};

const updateAdvertisement = async (req, res) => {
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
    res.status(500).json({error: `Failed to update advertisement: ${error.message}`});
  }
};

const deleteAdvertisement = async (req, res) => {
  try {
    const {id} = req.params;
    const docRef = admin.firestore().collection("advertisements").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({error: "Advertisement not found"});
    }

    const data = doc.data();
    const deletionErrors = [];

    if (data.image) {
      try {
        const fileName = data.image.split("/").pop().split("?")[0];
        const filePath = `advertisements/${fileName}`;
        const file = storage.bucket().file(filePath);
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

    if (data.video) {
      try {
        const fileName = data.video.split("/").pop().split("?")[0];
        const filePath = `advertisements/${fileName}`;
        const file = storage.bucket().file(filePath);
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
    res.status(500).json({error: `Failed to delete advertisement: ${error.message}`});
  }
};

module.exports = {getAllAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement};
