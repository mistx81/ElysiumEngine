import { useEffect, useState, useCallback } from "react";

const styles: Record<string, any> = {
  container: {
    padding: "24px",
    backgroundColor: "#0a0e17",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: { fontSize: "24px", fontWeight: 700, margin: "0 0 20px 0" },
  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  input: {
    padding: "8px 12px",
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    minWidth: "220px",
  },
  select: {
    padding: "8px 12px",
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    cursor: "pointer",
  },
  tableWrap: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#94a3b8",
    borderBottom: "1px solid #2a3548",
    backgroundColor: "#0a0e17",
  },
  td: {
    padding: "12px 14px",
    fontSize: "14px",
    borderBottom: "1px solid #2a3548",
  },
  rowHover: { cursor: "default" },
  badge: {
    padding: "3px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
    display: "inline-block",
  },
  roleOwner: { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" },
  roleAdmin: { backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  roleModerator: { backgroundColor: "rgba(6,182,212,0.15)", color: "#06b6d4" },
  roleDeveloper: { backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" },
  roleUser: { backgroundColor: "rgba(148,163,184,0.15)", color: "#94a3b8" },
  badgeBanned: { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" },
  badgeActive: { backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" },
  actions: { display: "flex", gap: "6px", alignItems: "center", position: "relative" },
  actionBtn: {
    padding: "4px 10px",
    borderRadius: "5px",
    border: "1px solid #2a3548",
    backgroundColor: "#0a0e17",
    color: "#e2e8f0",
    fontSize: "12px",
    cursor: "pointer",
  },
  btnDanger: { borderColor: "#ef4444", color: "#ef4444" },
  btnWarn: { borderColor: "#f59e0b", color: "#f59e0b" },
  btnSuccess: { borderColor: "#10b981", color: "#10b981" },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "4px",
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    zIndex: 10,
    minWidth: "140px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },
  dropdownItem: {
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    color: "#e2e8f0",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
  },
  pageBtn: {
    padding: "8px 16px",
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "14px",
  },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  loading: { textAlign: "center", padding: "40px", color: "#94a3b8" },
  error: {
    padding: "12px",
    backgroundColor: "rgba(239,68,68,0.1)",
    border: "1px solid #ef4444",
    borderRadius: "6px",
    color: "#ef4444",
    marginBottom: "16px",
    fontSize: "14px",
  },
  confirmOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  confirmBox: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "24px",
    minWidth: "360px",
  },
  confirmText: { marginBottom: "20px", fontSize: "15px" },
  confirmActions: { display: "flex", gap: "10px", justifyContent: "flex-end" },
};

const roleBadge = (role: string): Record<string, any> => {
  const map: Record<string, any> = {
    owner: styles.roleOwner,
    admin: styles.roleAdmin,
    moderator: styles.roleModerator,
    developer: styles.roleDeveloper,
    user: styles.roleUser,
  };
  return map[role] ?? styles.roleUser;
};

export default function UsersSection(props: any) {
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    banned: "all",
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownUser, setDropdownUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const users: any[] = props?.users ?? [];
  const totalPages: number = props?.totalPages ?? 1;
  const error: string | undefined = props?.error;

  const refresh = useCallback(
    async (f: typeof filters, p: number) => {
      if (props?.refreshUsers) {
        setLoading(true);
        try {
          await props.refreshUsers(f, p);
        } finally {
          setLoading(false);
        }
      }
    },
    [props]
  );

  useEffect(() => {
    refresh(filters, page);
  }, [filters, page, refresh]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setDropdownUser(null);
    if (props?.changeUserRole) await props.changeUserRole(userId, newRole);
    refresh(filters, page);
  };

  const handleToggleBan = async (userId: string) => {
    if (props?.toggleBan) await props.toggleBan(userId);
    refresh(filters, page);
  };

  const handleDelete = async () => {
    if (confirmDelete && props?.removeUser) {
      await props.removeUser(confirmDelete.id);
      setConfirmDelete(null);
      refresh(filters, page);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>User Management</h1>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.toolbar}>
        <input
          style={styles.input}
          placeholder="Search by email or display name..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
        <select
          style={styles.select}
          value={filters.role}
          onChange={(e) => updateFilter("role", e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="developer">Developer</option>
          <option value="user">User</option>
        </select>
        <select
          style={styles.select}
          value={filters.banned}
          onChange={(e) => updateFilter("banned", e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="banned">Banned</option>
          <option value="active">Active</option>
        </select>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Display Name</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Banned</th>
              <th style={styles.th}>Created At</th>
              <th style={styles.th}>Last Login</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={styles.loading}>
                  Loading users...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} style={styles.loading}>
                  No users found.
                </td>
              </tr>
            )}
            {!loading &&
              users.map((user: any) => (
                <tr key={user.id} style={styles.rowHover}>
                  <td style={styles.td}>{user.email ?? "—"}</td>
                  <td style={styles.td}>{user.display_name ?? user.displayName ?? "—"}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...roleBadge(user.role) }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(user.banned ? styles.badgeBanned : styles.badgeActive),
                      }}
                    >
                      {user.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={styles.td}>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.actionBtn}
                        onClick={() =>
                          setDropdownUser(dropdownUser === user.id ? null : user.id)
                        }
                      >
                        Role ▾
                      </button>
                      {dropdownUser === user.id && (
                        <div style={styles.dropdown}>
                          {["owner", "admin", "moderator", "developer", "user"]
                            .filter((r) => r !== user.role)
                            .map((r) => (
                              <div
                                key={r}
                                style={styles.dropdownItem}
                                onClick={() => handleRoleChange(user.id, r)}
                              >
                                Set {r}
                              </div>
                            ))}
                        </div>
                      )}
                      <button
                        style={{
                          ...styles.actionBtn,
                          ...(user.banned ? styles.btnSuccess : styles.btnWarn),
                        }}
                        onClick={() => handleToggleBan(user.id)}
                      >
                        {user.banned ? "Unban" : "Ban"}
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.btnDanger }}
                        onClick={() => setConfirmDelete(user)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          style={{ ...styles.pageBtn, ...(page === 0 ? styles.pageBtnDisabled : {}) }}
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ← Prev
        </button>
        <span style={{ fontSize: "14px", color: "#94a3b8" }}>
          Page {page + 1} of {totalPages}
        </span>
        <button
          style={{
            ...styles.pageBtn,
            ...(page >= totalPages - 1 ? styles.pageBtnDisabled : {}),
          }}
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>

      {confirmDelete && (
        <div style={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmText}>
              Are you sure you want to delete user{" "}
              <strong>{confirmDelete.email ?? confirmDelete.display_name}</strong>? This
              action cannot be undone.
            </div>
            <div style={styles.confirmActions}>
              <button style={styles.pageBtn} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                style={{ ...styles.pageBtn, ...styles.btnDanger, borderColor: "#ef4444" }}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
