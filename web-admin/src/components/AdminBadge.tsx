interface AdminBadgeProps {
  user: { id: number; username: string; role: string } | null;
}

const AdminBadge = ({ user }: AdminBadgeProps) => {
  return (
    <div className="admin-badge" aria-label="Admin session">
      <div className="admin-dot" aria-hidden="true" />
      <div>
        <div className="admin-title">{user?.username || "Admin"}</div>
        <div className="admin-subtitle">{user?.role || "Administrator"}</div>
      </div>
    </div>
  );
};

export default AdminBadge;
