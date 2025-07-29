const express = require("express");
const {authenticate} = require("../middleware");
const {getAllTeam, getTeamMember, getPublicTeamMember, createTeamMember, updateTeamMember, deleteTeamMember} = require("../controllers/teamController");

const router = express.Router();

router.get("/", getAllTeam);
router.get("/:id", authenticate, getTeamMember);
router.get("/public/:id", getPublicTeamMember);
router.post("/", authenticate, createTeamMember);
router.put("/:id", authenticate, updateTeamMember);
router.delete("/:id", authenticate, deleteTeamMember);

const setupTeamRoutes = (app) => {
  app.use("/team", router);
};

module.exports = {setupTeamRoutes};
