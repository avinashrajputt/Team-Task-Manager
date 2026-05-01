import Project from "../models/Project.js";

export async function loadProject(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const project = await Project.findById(projectId).populate("members.user", "_id name email");
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  req.project = project;
  return next();
}

export function requireProjectRole(requiredRole) {
  return (req, res, next) => {
    const project = req.project;
    if (!project) {
      return res.status(500).json({ message: "Project not loaded" });
    }

    const member = project.members.find((item) =>
      item.user._id.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ message: "Not a project member" });
    }

    if (requiredRole === "member") {
      return next();
    }

    if (member.role !== "admin") {
      return res.status(403).json({ message: "Admin role required" });
    }

    return next();
  };
}
