import { Router } from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { loadProject, requireProjectRole } from "../middleware/projectAccess.js";
import { isValidRole, requireFields } from "../utils/validators.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id })
    .populate("owner", "_id name email")
    .populate("members.user", "_id name email");

  return res.json({ projects });
});

router.post("/", async (req, res) => {
  const error = requireFields(req.body, ["name"]);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const project = await Project.create({
    name: req.body.name,
    description: req.body.description || "",
    owner: req.user._id,
    members: [{ user: req.user._id, role: "admin" }]
  });

  return res.status(201).json({ project });
});

router.get("/:id", loadProject, requireProjectRole("member"), async (req, res) => {
  const tasks = await Task.find({ project: req.project._id })
    .populate("assignee", "_id name email")
    .sort({ createdAt: -1 });

  return res.json({ project: req.project, tasks });
});

router.put("/:id", loadProject, requireProjectRole("admin"), async (req, res) => {
  req.project.name = req.body.name ?? req.project.name;
  req.project.description = req.body.description ?? req.project.description;
  await req.project.save();
  return res.json({ project: req.project });
});

router.delete("/:id", loadProject, requireProjectRole("admin"), async (req, res) => {
  await Task.deleteMany({ project: req.project._id });
  await req.project.deleteOne();
  return res.json({ message: "Project deleted" });
});

router.post("/:id/members", loadProject, requireProjectRole("admin"), async (req, res) => {
  const error = requireFields(req.body, ["email", "role"]);
  if (error) {
    return res.status(400).json({ message: error });
  }

  if (!isValidRole(req.body.role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const existing = req.project.members.find((member) =>
    member.user._id.toString() === user._id.toString()
  );
  if (existing) {
    return res.status(409).json({ message: "User already in project" });
  }

  req.project.members.push({ user: user._id, role: req.body.role });
  await req.project.save();
  return res.status(201).json({ project: req.project });
});

router.patch("/:id/members/:userId", loadProject, requireProjectRole("admin"), async (req, res) => {
  if (!isValidRole(req.body.role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const member = req.project.members.find((item) =>
    item.user._id.toString() === req.params.userId
  );

  if (!member) {
    return res.status(404).json({ message: "Member not found" });
  }

  member.role = req.body.role;
  await req.project.save();
  return res.json({ project: req.project });
});

router.delete("/:id/members/:userId", loadProject, requireProjectRole("admin"), async (req, res) => {
  req.project.members = req.project.members.filter((item) =>
    item.user._id.toString() !== req.params.userId
  );
  await req.project.save();
  return res.json({ project: req.project });
});

export default router;
