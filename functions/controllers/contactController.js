const {admin, FieldValue} = require("../firebaseConfig");

const createContact = async (req, res) => {
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
};

const getAllContacts = async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("contacts").get();
    const contacts = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(contacts);
  } catch (error) {
    res.status(500).json({error: `Failed to fetch contact submissions: ${error.message}`});
  }
};

const updateContact = async (req, res) => {
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
};

const deleteContact = async (req, res) => {
  try {
    const {id} = req.params;
    await admin.firestore().collection("contacts").doc(id).delete();
    res.json({message: "Contact deleted"});
  } catch (error) {
    res.status(500).json({error: `Failed to delete contact: ${error.message}`});
  }
};

module.exports = {createContact, getAllContacts, updateContact, deleteContact};
