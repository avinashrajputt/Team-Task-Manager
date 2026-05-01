import { useEffect, useState } from "react";
import { createProject, getDashboard, getProjects } from "../api/client.js";
import ProjectList from "../components/ProjectList.jsx";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [dashboard, setDashboard] = useState({ counts: {}, overdue: [] });
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const [projectsData, dashboardData] = await Promise.all([
        getProjects(),
        getDashboard()
      ]);
      setProjects(projectsData.projects || []);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await createProject(form);
      setProjects((prev) => [data.project, ...prev]);
      setForm({ name: "", description: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <div>
          <h1>Your Team Dashboard</h1>
          <p className="muted">Track tasks, status, and overdue work at a glance.</p>
        </div>
        <div className="stats">
          <div className="stat">
            <span>To do</span>
            <strong>{dashboard.counts?.todo || 0}</strong>
          </div>
          <div className="stat">
            <span>In progress</span>
            <strong>{dashboard.counts?.in_progress || 0}</strong>
          </div>
          <div className="stat">
            <span>Done</span>
            <strong>{dashboard.counts?.done || 0}</strong>
          </div>
        </div>
      </div>

      <section className="section">
        <h2>Create project</h2>
        <form className="form inline" onSubmit={handleCreate}>
          <input
            placeholder="Project name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            placeholder="Short description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <button className="btn" type="submit">
            Add project
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="section">
        <h2>Projects</h2>
        <ProjectList projects={projects} />
      </section>

      <section className="section">
        <h2>Overdue tasks</h2>
        {dashboard.overdue?.length ? (
          <div className="stack">
            {dashboard.overdue.map((task) => (
              <div key={task._id} className="card">
                <h4>{task.title}</h4>
                <p className="muted">Due {new Date(task.dueDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No overdue tasks.</p>
        )}
      </section>
    </div>
  );
}
