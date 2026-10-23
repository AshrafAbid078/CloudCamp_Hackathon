'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  KeyRound,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { Button, Input, Chip } from '@/components/common';
import { adminApi } from '@/lib/api';
import type { AdminUserRecord, UserRole } from '@/lib/types';

export function AdminConsole() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('facility_manager');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch user directory',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    setIsSubmitting(true);
    try {
      await adminApi.registerUser({
        username: newUsername,
        password: newPassword,
        role: newRole,
      });
      setNotification({
        type: 'success',
        message: `Account created for '${newUsername}' with role '${newRole}'.`,
      });
      setNewUsername('');
      setNewPassword('');
      setIsCreating(false);
      fetchUsers();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'User creation failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to deactivate user '${username}'?`)) return;

    try {
      const res = await adminApi.deactivateUser(userId);
      setNotification({
        type: 'success',
        message: res.detail || `User '${username}' has been deactivated.`,
      });
      fetchUsers();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to deactivate user',
      });
    }
  };

  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--accent-solar)]" />
              <span>Identity & Access Directory</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] border border-[var(--accent-solar)]/30 font-bold uppercase">
              Admin Protected
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Provision roles, audit access privileges, and enforce authentication security policies across facilities.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Roster
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            {isCreating ? 'Cancel' : 'Provision User'}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-md ${
              notification.type === 'success'
                ? 'bg-[var(--accent-clean)]/15 border-[var(--accent-clean)]/30 text-[var(--accent-clean)]'
                : 'bg-[var(--accent-danger)]/15 border-[var(--accent-danger)]/30 text-[var(--accent-danger)]'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-[10px] font-bold underline opacity-80 hover:opacity-100 cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provision User Drawer / Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreateUser}
              className="p-6 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] font-heading">
                  <UserPlus className="w-4 h-4 text-[var(--accent-solar)]" />
                  <span>Provision New User Credentials</span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">FastAPI RBAC Endpoint: POST /auth/register</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Username / Work Email
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. ops_director@epz.bd"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Initial Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Authorization Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-solar)] cursor-pointer"
                  >
                    <option value="facility_manager">Facility Manager (Plant Cost & Assets)</option>
                    <option value="grid_operator">Grid Operator (Feeder Dispatch & Relief)</option>
                    <option value="admin">System Administrator (Full Control)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Create User
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Roster Table */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <div className="flex items-center gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Registered System Operators
            </h4>
            <Chip variant="clean" size="sm">
              {activeCount} Active Accounts
            </Chip>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            SQLite Database: backend/meridian.db
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Username / Identifier</th>
                <th className="py-2.5 px-3">Role Hierarchy</th>
                <th className="py-2.5 px-3">Account Status</th>
                <th className="py-2.5 px-3">Password Policy</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]/60">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isFM = u.role === 'facility_manager';
                return (
                  <tr key={u.id} className="hover:bg-[var(--bg-surface-raised)]/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-[var(--text-muted)]">#{u.id}</td>
                    <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                      <div className="flex items-center gap-1.5">
                        {isAdmin ? <Lock className="w-3.5 h-3.5 text-[var(--accent-solar)]" /> : null}
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          isAdmin
                            ? 'bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] border border-[var(--accent-solar)]/30'
                            : isFM
                            ? 'bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.is_active ? (
                        <span className="flex items-center gap-1.5 text-[var(--accent-clean)] text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clean)]" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[var(--accent-danger)] text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-danger)]" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {u.must_change_password ? (
                        <span className="text-[10px] text-[var(--accent-solar)] flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Change on next login
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">Verified</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)] font-mono text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Seed'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isAdmin ? (
                        <span className="text-[10px] text-[var(--text-muted)] italic">Protected</span>
                      ) : u.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(u.id, u.username)}
                          className="text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/15 text-xs py-1 px-2.5"
                          title="Soft-delete user (deactivate account)"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <span className="text-[10px] text-[var(--accent-danger)]">Deactivated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
