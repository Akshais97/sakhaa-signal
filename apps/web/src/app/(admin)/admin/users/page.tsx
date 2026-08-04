"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  membershipRole: string;
  workspaceId: string | null;
  workspaceName: string;
  planCode: string;
  creditBalance: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("CLIENT_MANAGER");
  const [planCode, setPlanCode] = useState("GROWTH");
  const [initialCredits, setInitialCredits] = useState(100);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      setActionError("Failed to load platform users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          role,
          planCode,
          initialCredits: Number(initialCredits),
        }),
      });

      if (res.ok) {
        setActionSuccess(`User ${email} created successfully with ${planCode} plan!`);
        setEmail("");
        setDisplayName("");
        fetchUsers();
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to create user.");
      }
    } catch {
      setActionError("Error creating user account.");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userEmail}? This will revoke all permissions.`)) return;

    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setActionSuccess(`Permanently deleted user ${userEmail}.`);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to delete user.");
      }
    } catch {
      setActionError("Failed to delete user.");
    }
  };

  const handleUpdatePlanAndCredits = async (userId: string, newPlan: string, currentBalance: number) => {
    const newBalanceStr = prompt(`Update credit balance for user (Current: ${currentBalance}):`, currentBalance.toString());
    if (newBalanceStr === null) return;
    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance)) return;

    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: newPlan,
          creditBalance: newBalance,
        }),
      });

      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, planCode: newPlan, creditBalance: newBalance } : u
          )
        );
        setActionSuccess("Updated plan and credit balance successfully.");
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to update plan/credits.");
      }
    } catch {
      setActionError("Failed to update plan/credits.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.workspaceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.planCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F3F2EF]">User Accounts & Subscription Plans</h1>
          <p className="text-sm text-[#B4B0A7] mt-1">
            Super Admin control: Provision users, inspect credit balances, assign subscription tiers, or purge accounts.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-[#121110] border border-[#2E2B26] text-xs font-mono text-[#B4B0A7] hover:text-white hover:border-[#7C70F6] rounded-md transition-all flex items-center gap-2"
        >
          <span>🔄</span> Refresh Users List
        </button>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl bg-[#7C70F6]/10 border border-[#7C70F6]/30 text-xs font-mono text-[#7C70F6]">
          ⚠️ {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-[#5BD08C]/10 border border-[#5BD08C]/30 text-xs font-mono text-[#5BD08C]">
          ✓ {actionSuccess}
        </div>
      )}

      {/* Provision New User Card */}
      <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
        <h2 className="text-base font-semibold text-[#F3F2EF] mb-4">Provision & Invite New Application User</h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-3.5 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-xs text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6]"
          />
          <input
            type="text"
            placeholder="Display Name (Optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="px-3.5 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-xs text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6]"
          />
          <select
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value)}
            className="px-3.5 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-xs text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6] font-mono"
          >
            <option value="STARTER">Starter Plan ($49/mo - 20 Cr)</option>
            <option value="GROWTH">Growth Plan ($149/mo - 100 Cr)</option>
            <option value="PRO">Pro Enterprise ($399/mo - 350 Cr)</option>
          </select>
          <input
            type="number"
            placeholder="Initial Credits"
            value={initialCredits}
            onChange={(e) => setInitialCredits(Number(e.target.value))}
            required
            className="px-3.5 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-xs text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6] font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-md bg-[#7C70F6] hover:bg-[#6557F5] text-white text-xs font-mono font-bold transition-all"
          >
            Provision User
          </button>
        </form>
      </div>

      {/* Live Search */}
      <div className="bg-[#121110] border border-[#2E2B26] p-4 rounded-xl">
        <input
          type="text"
          placeholder="Filter users by email, workspace, or plan tier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1A1815] border border-[#46433C] rounded-lg px-4 py-2 text-sm text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6] font-mono"
        />
      </div>

      {/* User Accounts Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#F3F2EF]">Registered Application Users ({filteredUsers.length})</h2>

        {loading ? (
          <div className="p-8 text-center text-sm font-mono text-[#8A867C] bg-[#121110] border border-[#2E2B26] rounded-xl animate-pulse">
            Loading platform users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm font-mono text-[#8A867C] bg-[#121110] border border-[#2E2B26] rounded-xl">
            No matching users found.
          </div>
        ) : (
          <div className="border border-[#2E2B26] rounded-xl overflow-hidden divide-y divide-[#2E2B26] bg-[#121110]">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F3F2EF]">{u.displayName || u.email}</span>
                    <span className="text-[10px] font-mono text-[#8A867C] bg-[#1A1815] px-2 py-0.5 rounded border border-[#2E2B26]">
                      {u.email}
                    </span>
                  </div>
                  <p className="text-xs text-[#8A867C] font-mono">
                    Workspace: <span className="text-[#5FC6DD]">{u.workspaceName}</span> &bull; Created: {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Credit Balance Badge */}
                  <div className="px-3 py-1.5 rounded-lg bg-[#5BD08C]/10 border border-[#5BD08C]/30 text-[#5BD08C] text-xs font-mono font-bold">
                    💰 {u.creditBalance.toFixed(1)} Credits
                  </div>

                  {/* Plan Selector */}
                  <select
                    value={u.planCode}
                    onChange={(e) => handleUpdatePlanAndCredits(u.id, e.target.value, u.creditBalance)}
                    className="px-3 py-1.5 bg-[#1A1815] border border-[#46433C] rounded text-xs font-mono text-[#7C70F6] focus:outline-none focus:border-[#7C70F6]"
                  >
                    <option value="STARTER">STARTER ($49/mo)</option>
                    <option value="GROWTH">GROWTH ($149/mo)</option>
                    <option value="PRO">PRO ($399/mo)</option>
                  </select>

                  {/* Adjust Balance Button */}
                  <button
                    onClick={() => handleUpdatePlanAndCredits(u.id, u.planCode, u.creditBalance)}
                    className="px-3 py-1.5 rounded bg-[#7C70F6]/10 border border-[#7C70F6]/30 text-[#7C70F6] hover:bg-[#7C70F6] hover:text-white text-xs font-mono transition-all"
                  >
                    Set Credits
                  </button>

                  {/* Delete User Button */}
                  <button
                    onClick={() => handleDeleteUser(u.id, u.email || "User")}
                    className="px-3 py-1.5 rounded bg-[#7C70F6]/10 border border-[#7C70F6]/30 text-[#7C70F6] hover:bg-[#7C70F6] hover:text-white text-xs font-mono transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
