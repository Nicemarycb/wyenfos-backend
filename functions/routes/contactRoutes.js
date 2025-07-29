const express = require("express");
const {authenticate} = require("../middleware");
const {createContact, getAllContacts, updateContact, deleteContact} = require("../controllers/contactController");

const router = express.Router();

router.post("/", createContact);
router.get("/", authenticate, getAllContacts);
router.put("/:id", authenticate, updateContact);
router.delete("/:id", authenticate, deleteContact);

const setupContactRoutes = (app) => {
  app.use("/contacts", router);
};

module.exports = {setupContactRoutes};
