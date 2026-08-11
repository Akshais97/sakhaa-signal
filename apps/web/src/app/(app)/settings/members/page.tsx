"use client";

import React, { useState, useEffect } from "react";
import AppNavbar from "@/components/layout/AppNavbar";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
}

export default function MembersPage() {
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("REVIEWER");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
        if (data.user) setUser(data.user);

        if (data.workspace?.id) {
          const memRes = await fetch(`/api/workspaces/${data.workspace.id}/invites`);
          if (memRes.ok) {
            const memData = await memRes.json();
            setMembers(memData.members || []);
            setInvites(memData.invites || []);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to load workspace members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !workspace?.id) return;
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedLink(data.inviteUrl);
        setInvites([data.invite, ...invites.filter((i) => i.id !== data.invite.id)]);
        setEmail("");
        setActionSuccess(`Invitation link created for ${email}`);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to send invitation.");
      }
    } catch {
      setActionError("Network error while creating invite.");
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!workspace?.id) return;
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this workspace?`)) return;

    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
        setActionSuccess(`Removed ${memberEmail} from workspace.`);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to remove member.");
      }
    } catch {
      setActionError("Failed to remove member.");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!workspace?.id) return;
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(members.map((m) => (m.id === memberId ? data.member : m)));
        setActionSuccess("Updated member role successfully.");
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to update role.");
      }
    } catch {
      setActionError("Failed to update role.");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!workspace?.id) return;
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvites(invites.filter((i) => i.id !== inviteId));
        setActionSuccess("Invitation revoked.");
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to revoke invitation.");
      }
    } catch {
      setActionError("Failed to revoke invitation.");
    }
  };

  const filteredMembers = members.filter(
    (m: Member) =>
      m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = invites.filter(
    (i: Invite) =>
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0A09] text-[#F3F2EF] font-sans flex flex-col justify-between">
      <AppNavbar user={user} workspace={workspace} />

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2E2B26] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#F3F2EF]">Team & Workspace Members</h1>
            <p className="text-sm text-[#B4B0A7] mt-1">
              Manage workspace access, invite colleagues, assign roles, or remove members.
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#121110] border border-[#2E2B26] text-xs font-mono text-[#B4B0A7] hover:text-white hover:border-[#7C70F6] rounded-md transition-all flex items-center gap-2"
          >
            <span>🔄</span> Refresh Members List
          </button>
        </div>

        {/* Action Error / Success Alerts */}
        {actionError && (
          <div className="p-4 rounded-xl bg-[#F2786C]/10 border border-[#F2786C]/30 text-xs font-mono text-[#F2786C]">
            ⚠️ {actionError}
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-[#5BD08C]/10 border border-[#5BD08C]/30 text-xs font-mono text-[#5BD08C]">
            ✓ {actionSuccess}
          </div>
        )}

        {/* Invite Form Card */}
        <div className="p-6 rounded-xl bg-[#121110] border border-[#2E2B26]">
          <h2 className="text-base font-semibold text-[#F3F2EF] mb-4">Invite New Workspace Member</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-sm text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6]"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-2.5 bg-[#1A1815] border border-[#46433C] rounded-md text-sm text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6]"
            >
              <option value="REVIEWER">Reviewer (Read-Only Reports)</option>
              <option value="CLIENT_MANAGER">Client Manager (Run Jobs)</option>
              <option value="ADMIN">Admin (Manage Workspace)</option>
              <option value="OWNER">Owner (Full Permissions)</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-md bg-[#7C70F6] text-white text-sm font-semibold hover:bg-[#6557F5] transition-all shrink-0"
            >
              Send Invite
            </button>
          </form>

          {generatedLink && (
            <div className="mt-4 p-4 rounded-md bg-[#7C70F6]/10 border border-[#7C70F6]/30 text-xs font-mono text-[#D4D1CA] space-y-1">
              <p className="text-[#7C70F6] font-semibold">INVITATION CREATED:</p>
              <p className="break-all select-all text-[#F3F2EF]">{generatedLink}</p>
            </div>
          )}
        </div>

        {/* Live Search & Filter Bar */}
        <div className="flex justify-between items-center bg-[#121110] border border-[#2E2B26] p-4 rounded-xl">
          <input
            type="text"
            placeholder="Search members by email or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1815] border border-[#46433C] rounded-lg px-4 py-2 text-sm text-[#F3F2EF] focus:outline-none focus:border-[#7C70F6] font-mono"
          />
        </div>

        {/* Active Members List */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-[#F3F2EF]">
            Active Workspace Members ({filteredMembers.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-sm font-mono text-[#8A867C] bg-[#121110] border border-[#2E2B26] rounded-xl animate-pulse">
              Loading workspace member list...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-sm font-mono text-[#8A867C] bg-[#121110] border border-[#2E2B26] rounded-xl">
              No matching workspace members found.
            </div>
          ) : (
            <div className="border border-[#2E2B26] rounded-xl overflow-hidden divide-y divide-[#2E2B26] bg-[#121110]">
              {filteredMembers.map((m) => (
                <div key={m.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#7C70F6]/20 border border-[#7C70F6]/40 text-[#7C70F6] font-bold flex items-center justify-center text-sm">
                      {m.user?.email ? m.user.email.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F3F2EF]">
                        {m.user?.displayName || m.user?.email || "Workspace User"}
                      </p>
                      <p className="text-xs text-[#8A867C] font-mono">{m.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Role Selector */}
                    <select
                      value={m.role}
                      onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                      className="px-3 py-1.5 bg-[#1A1815] border border-[#46433C] rounded text-xs font-mono text-[#5FC6DD] focus:outline-none focus:border-[#7C70F6]"
                    >
                      <option value="OWNER">OWNER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="CLIENT_MANAGER">CLIENT_MANAGER</option>
                      <option value="REVIEWER">REVIEWER</option>
                    </select>

                    {/* Remove Member Button */}
                    <button
                      onClick={() => handleRemoveMember(m.id, m.user?.email || "Member")}
                      className="px-3 py-1.5 rounded bg-[#F2786C]/10 border border-[#F2786C]/30 text-[#F2786C] hover:bg-[#F2786C] hover:text-white text-xs font-mono transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invites List */}
        {filteredInvites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#F3F2EF]">
              Pending Invitations ({filteredInvites.length})
            </h3>
            <div className="border border-[#2E2B26] rounded-xl overflow-hidden divide-y divide-[#2E2B26] bg-[#121110]">
              {filteredInvites.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-[#F3F2EF]">{inv.email}</p>
                    <p className="text-xs text-[#8A867C] font-mono">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-[#FF6B3D]/10 border border-[#FF6B3D]/30 text-[#FF6B3D] px-2.5 py-1 rounded">
                      {inv.status} ({inv.role})
                    </span>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="px-2.5 py-1 text-xs font-mono text-[#F2786C] hover:underline"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#2E2B26] py-6 px-6 text-center text-xs text-[#8A867C] font-mono">
        Sakhaa Signal SaaS Team Management
      </footer>
    </div>
  );
}
