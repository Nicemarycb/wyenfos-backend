const express = require("express");
const {authenticate} = require("../middleware");
const {getAllAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement} = require("../controllers/advertisementController");

const router = express.Router();

router.get("/", getAllAdvertisements);
router.post("/", authenticate, createAdvertisement);
router.put("/:id", authenticate, updateAdvertisement);
router.delete("/:id", authenticate, deleteAdvertisement);

const setupAdvertisementRoutes = (app) => {
  app.use("/advertisements", router);
};

module.exports = {setupAdvertisementRoutes};
