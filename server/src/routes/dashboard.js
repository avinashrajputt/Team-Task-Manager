import { Router } from "express";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", requireAuth, async (req, res) => {
  const tasks = await Task.find({ assignee: req.user._id }).sort({ dueDate: 1 });

  const now = new Date();
  const counts = {
    todo: tasks.filter((task) => task.status === "todo").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    done: tasks.filter((task) => task.status === "done").length
  };

  const overdue = tasks.filter(
    (task) => task.dueDate && task.dueDate < now && task.status !== "done"
  );

  return res.json({ tasks, counts, overdue });
});

export default router;
