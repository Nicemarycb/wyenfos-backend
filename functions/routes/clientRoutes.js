const express = require("express");
const {authenticate} = require("../middleware");
const {getAllClients, createClient, updateClient, deleteClient} = require("../controllers/clientController");

const router = express.Router();

router.get("/", getAllClients);
router.post("/", authenticate, createClient);
router.put("/:id", authenticate, updateClient);
router.delete("/:id", authenticate, deleteClient);

const setupClientRoutes = (app) => {
  app.use("/clients", router);
};

module.exports = {setupClientRoutes};
