import { Router } from "express";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { loadProject, requireProjectRole } from "../middleware/projectAccess.js";
import { isValidStatus, requireFields } from "../utils/validators.js";

const router = Router();

router.use(requireAuth);

router.post("/projects/:projectId/tasks", loadProject, requireProjectRole("admin"), async (req, res) => {
  const error = requireFields(req.body, ["title"]);
  if (error) {
    return res.status(400).json({ message: error });
  }

  let assigneeId = null;
  if (req.body.assigneeId) {
    const member = req.project.members.find((item) =>
      item.user._id.toString() === req.body.assigneeId
    );
    if (!member) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }
    assigneeId = req.body.assigneeId;
  }

  const task = await Task.create({
    project: req.project._id,
    title: req.body.title,
    description: req.body.description || "",
    status: "todo",
    assignee: assigneeId,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  return res.status(201).json({ task });
});

router.get("/projects/:projectId/tasks", loadProject, requireProjectRole("member"), async (req, res) => {
  const tasks = await Task.find({ project: req.project._id })
    .populate("assignee", "_id name email")
    .sort({ createdAt: -1 });
  return res.json({ tasks });
});

router.patch("/tasks/:taskId", requireAuth, async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  await task.populate({
    path: "project",
    populate: { path: "members.user", select: "_id name email" }
  });

  const member = task.project.members.find((item) =>
    item.user._id.toString() === req.user._id.toString()
  );

  if (!member) {
    return res.status(403).json({ message: "Not a project member" });
  }

  const isAdmin = member.role === "admin";
  const isAssignee = task.assignee?.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (req.body.status && !isValidStatus(req.body.status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (req.body.title && !isAdmin) {
    return res.status(403).json({ message: "Only admin can edit title" });
  }

  if (req.body.assigneeId && !isAdmin) {
    return res.status(403).json({ message: "Only admin can assign tasks" });
  }

  if (req.body.assigneeId) {
    const assignee = project.project.members.find((item) =>
      item.user._id.toString() === req.body.assigneeId
    );
    if (!assignee) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }
    task.assignee = req.body.assigneeId;
  }

  task.title = req.body.title ?? task.title;
  task.description = req.body.description ?? task.description;
  task.status = req.body.status ?? task.status;
  task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate;
  task.updatedBy = req.user._id;

  await task.save();
  return res.json({ task });
});

router.delete("/tasks/:taskId", requireAuth, async (req, res) => {
  const task = await Task.findById(req.params.taskId).populate({
    path: "project",
    populate: { path: "members.user", select: "_id name email" }
  });
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const member = task.project.members.find((item) =>
    item.user._id.toString() === req.user._id.toString()
  );

  if (!member || member.role !== "admin") {
    return res.status(403).json({ message: "Admin role required" });
  }

  await task.deleteOne();
  return res.json({ message: "Task deleted" });
});

export default router;
