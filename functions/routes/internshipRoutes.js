const express = require("express");
const {authenticate} = require("../middleware");
const {createInternshipInquiry, getAllInternshipInquiries, updateInternshipInquiry, deleteInternshipInquiry} = require("../controllers/internshipController");

const router = express.Router();

router.post("/", createInternshipInquiry);
router.get("/", authenticate, getAllInternshipInquiries);
router.put("/:id", authenticate, updateInternshipInquiry);
router.delete("/:id", authenticate, deleteInternshipInquiry);

const setupInternshipRoutes = (app) => {
  app.use("/internship-inquiries", router);
};

module.exports = {setupInternshipRoutes};
