// const {admin, FieldValue} = require("../firebaseConfig");

// const createInternshipInquiry = async (req, res) => {
//   try {
//     const {name, email, message, role, status} = req.body;
//     if (!name || !email || !message) {
//       return res.status(400).json({error: "Missing required fields"});
//     }
//     const docRef = await admin.firestore().collection("internship_inquiries").add({
//       name,
//       email,
//       message,
//       role: role || "Not specified",
//       status: status || "Pending",
//       timestamp: FieldValue.serverTimestamp(),
//     });
//     res.status(201).json({id: docRef.id, message: "Internship inquiry submitted"});
//   } catch (error) {
//     res.status(500).json({error: `Failed to submit internship inquiry: ${error.message}`});
//   }
// };

// const getAllInternshipInquiries = async (_req, res) => {
//   try {
//     const snapshot = await admin.firestore().collection("internship_inquiries").orderBy("timestamp", "desc").get();
//     const inquiries = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
//     res.json(inquiries);
//   } catch (error) {
//     res.status(500).json({error: `Failed to fetch internship inquiries: ${error.message}`});
//   }
// };

// const updateInternshipInquiry = async (req, res) => {
//   try {
//     const {id} = req.params;
//     const {status} = req.body;
//     if (!status) {
//       return res.status(400).json({error: "Missing required field: status"});
//     }
//     await admin.firestore().collection("internship_inquiries").doc(id).update({status});
//     res.json({message: `Internship inquiry ${status.toLowerCase()}`});
//   } catch (error) {
//     res.status(500).json({error: `Failed to update internship inquiry: ${error.message}`});
//   }
// };

// const deleteInternshipInquiry = async (req, res) => {
//   try {
//     const {id} = req.params;
//     const docRef = admin.firestore().collection("internship_inquiries").doc(id);
//     const doc = await docRef.get();

//     if (!doc.exists) {
//       return res.status(404).json({error: "Internship inquiry not found"});
//     }

//     await docRef.delete();
//     res.json({message: "Internship inquiry deleted"});
//   } catch (error) {
//     res.status(500).json({error: `Failed to delete internship inquiry: ${error.message}`});
//   }
// };

// module.exports = {createInternshipInquiry, getAllInternshipInquiries, updateInternshipInquiry, deleteInternshipInquiry};

const {admin, FieldValue} = require("../firebaseConfig");

const createInternshipInquiry = async (req, res) => {
  try {
    const {name, email, message, role, status, resumeUrl} = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({error: "Missing required fields"});
    }
    const docRef = await admin.firestore().collection("internship_inquiries").add({
      name,
      email,
      message,
      role: role || "Not specified",
      status: status || "Pending",
      resumeUrl: resumeUrl || "", // Store resume URL, default to empty string if not provided
      timestamp: FieldValue.serverTimestamp(),
    });
    res.status(201).json({id: docRef.id, message: "Internship inquiry submitted"});
  } catch (error) {
    res.status(500).json({error: `Failed to submit internship inquiry: ${error.message}`});
  }
};

const getAllInternshipInquiries = async (_req, res) => {
  try {
    const snapshot = await admin.firestore().collection("internship_inquiries").orderBy("timestamp", "desc").get();
    const inquiries = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({error: `Failed to fetch internship inquiries: ${error.message}`});
  }
};

const updateInternshipInquiry = async (req, res) => {
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
};

const deleteInternshipInquiry = async (req, res) => {
  try {
    const {id} = req.params;
    const docRef = admin.firestore().collection("internship_inquiries").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({error: "Internship inquiry not found"});
    }

    await docRef.delete();
    res.json({message: "Internship inquiry deleted"});
  } catch (error) {
    res.status(500).json({error: `Failed to delete internship inquiry: ${error.message}`});
  }
};

module.exports = {createInternshipInquiry, getAllInternshipInquiries, updateInternshipInquiry, deleteInternshipInquiry};
