import { Link } from "react-router-dom";

export default function ProjectList({ projects }) {
  if (!projects.length) {
    return <p className="muted">No projects yet. Create your first project.</p>;
  }

  return (
    <div className="grid">
      {projects.map((project) => (
        <Link key={project._id} to={`/projects/${project._id}`} className="card">
          <h3>{project.name}</h3>
          <p className="muted">{project.description || "No description"}</p>
          <p className="meta">Members: {project.members.length}</p>
        </Link>
      ))}
    </div>
  );
}
