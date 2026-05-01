import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addMember,
  createTask,
  deleteTask,
  getMe,
  getProject,
  updateTask
} from "../api/client.js";
import TaskList from "../components/TaskList.jsx";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [me, setMe] = useState(null);
  const [memberForm, setMemberForm] = useState({ email: "", role: "member" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    dueDate: ""
  });
  const [error, setError] = useState("");

  const isAdmin = useMemo(() => {
    if (!project || !me) return false;
    const member = project.members.find((item) => item.user._id === me._id);
    return member?.role === "admin";
  }, [project, me]);

  async function loadProject() {
    try {
      const [projectData, meData] = await Promise.all([getProject(id), getMe()]);
      setProject(projectData.project);
      setTasks(projectData.tasks || []);
      setMe(meData.user);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadProject();
  }, [id]);

  async function handleAddMember(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await addMember(id, memberForm);
      setProject(data.project);
      setMemberForm({ email: "", role: "member" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await createTask(id, taskForm);
      setTasks((prev) => [data.task, ...prev]);
      setTaskForm({ title: "", description: "", assigneeId: "", dueDate: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateTask(taskId, payload) {
    try {
      const data = await updateTask(taskId, payload);
      setTasks((prev) => prev.map((task) => (task._id === taskId ? data.task : task)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!project) {
    return <div className="page">Loading project...</div>;
  }

  return (
    <div className="page">
      <div className="hero">
        <div>
          <h1>{project.name}</h1>
          <p className="muted">{project.description || "No description"}</p>
        </div>
        <div className="pill">Members: {project.members.length}</div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {isAdmin ? (
        <section className="section">
          <h2>Add team member</h2>
          <form className="form inline" onSubmit={handleAddMember}>
            <input
              type="email"
              placeholder="Email address"
              value={memberForm.email}
              onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })}
              required
            />
            <select
              value={memberForm.role}
              onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn" type="submit">
              Add member
            </button>
          </form>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="section">
          <h2>Create task</h2>
          <form className="form" onSubmit={handleCreateTask}>
            <input
              placeholder="Task title"
              value={taskForm.title}
              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
              required
            />
            <textarea
              placeholder="Task details"
              value={taskForm.description}
              onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
            />
            <div className="form-row">
              <select
                value={taskForm.assigneeId}
                onChange={(event) => setTaskForm({ ...taskForm, assigneeId: event.target.value })}
              >
                <option value="">Unassigned</option>
                {project.members.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name} ({member.role})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
              />
            </div>
            <button className="btn" type="submit">
              Add task
            </button>
          </form>
        </section>
      ) : null}

      <section className="section">
        <h2>Tasks</h2>
        <TaskList tasks={tasks} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
      </section>
    </div>
  );
}
