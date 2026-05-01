export default function TaskList({ tasks, onUpdate, onDelete }) {
  if (!tasks.length) {
    return <p className="muted">No tasks yet.</p>;
  }

  return (
    <div className="stack">
      {tasks.map((task) => (
        <div key={task._id} className="task">
          <div>
            <h4>{task.title}</h4>
            <p className="muted">{task.description || "No description"}</p>
            <div className="meta">
              <span>Status: {task.status.replace("_", " ")}</span>
              <span>Assignee: {task.assignee?.name || "Unassigned"}</span>
              <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}</span>
            </div>
          </div>
          <div className="task-actions">
            <select
              value={task.status}
              onChange={(event) => onUpdate(task._id, { status: event.target.value })}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <button className="btn ghost" onClick={() => onDelete(task._id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
