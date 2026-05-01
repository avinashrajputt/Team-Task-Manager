export function requireFields(payload, fields) {
  const missing = fields.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return `Missing fields: ${missing.join(", ")}`;
  }
  return null;
}

export function isValidRole(role) {
  return role === "admin" || role === "member";
}

export function isValidStatus(status) {
  return status === "todo" || status === "in_progress" || status === "done";
}
