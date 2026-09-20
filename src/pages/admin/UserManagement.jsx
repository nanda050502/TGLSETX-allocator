import React, { useState, useEffect } from 'react';
import { appStorage } from '../../services/appStorage';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  Key,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Home,
  X,
  Save,
  Lock
} from 'lucide-react';

export default function UserManagement() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusMsg, setStatusMsg] = useState(null);

  // Password visibility map: userId -> boolean
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('FACULTY');
  const [formEmail, setFormEmail] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    try {
      const users = appStorage.getAllUsers();
      setUsersList(users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswordMap(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('FACULTY');
    setFormEmail('');
    setFormRoomNumber('');
    setShowCreateModal(true);
    setStatusMsg(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormName(user.name || '');
    setFormUsername(user.username || '');
    setFormPassword(user.password || '');
    setFormRole(user.role || 'FACULTY');
    setFormEmail(user.email || '');
    setFormRoomNumber(user.room_number || '');
    setShowCreateModal(true);
    setStatusMsg(null);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (editingUser) {
      // Update
      const res = appStorage.updateUser(editingUser.id, {
        name: formName,
        username: formUsername,
        password: formPassword,
        role: formRole,
        email: formEmail,
        room_number: formRoomNumber
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: `User "${formName}" updated successfully!` });
        setShowCreateModal(false);
        loadUsers();
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update user' });
      }
    } else {
      // Create
      const res = appStorage.createUser({
        name: formName,
        username: formUsername,
        password: formPassword,
        role: formRole,
        email: formEmail,
        room_number: formRoomNumber
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: `User "${formName}" created successfully!` });
        setShowCreateModal(false);
        loadUsers();
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to create user' });
      }
    }
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete user account "${user.name}" (${user.username})?`)) {
      const res = appStorage.deleteUser(user.id);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `User "${user.name}" deleted successfully` });
        loadUsers();
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to delete user' });
      }
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.room_number && u.room_number.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (roleFilter === 'ADMIN') return u.role === 'ADMIN';
    if (roleFilter === 'FACULTY') return u.role === 'FACULTY';
    return true;
  });

  const adminCount = usersList.filter(u => u.role === 'ADMIN').length;
  const facultyCount = usersList.filter(u => u.role === 'FACULTY').length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-extrabold text-[11px] uppercase tracking-wide border border-indigo-200">
              DB AUTHORIZED
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage system administrator credentials, invigilators, and room access control.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="touch-target px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition focus-ring"
        >
          <UserPlus size={16} />
          Add New User
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</div>
            <div className="text-xl font-black text-slate-900 font-mono">{usersList.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administrators</div>
            <div className="text-xl font-black text-indigo-700 font-mono">{adminCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-subtle flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <User size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invigilators</div>
            <div className="text-xl font-black text-emerald-700 font-mono">{facultyCount}</div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users, usernames, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrators</option>
            <option value="FACULTY">Invigilators (Faculty)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Room</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isVisible = Boolean(showPasswordMap[u.id]);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center text-white ${
                              u.role === 'ADMIN'
                                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xs'
                                : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-xs'
                            }`}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-400">{u.email || 'No email registered'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {u.username}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <ShieldCheck size={12} /> ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <User size={12} /> INVIGILATOR
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.room_number ? (
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            Room {u.room_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {isVisible ? u.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                            title={isVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition border border-slate-200/70"
                            title="Edit User"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition border border-slate-200/70"
                            title="Delete User"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {editingUser ? <Edit2 size={16} /> : <UserPlus size={16} />}
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingUser ? 'Edit Account' : 'Create Account'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold font-mono rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Password"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold font-mono rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-extrabold rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50"
                  >
                    <option value="FACULTY">Invigilator (Faculty)</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Assigned Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 901"
                    value={formRoomNumber}
                    onChange={e => setFormRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ramesh@university.edu"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-indigo-500 bg-slate-50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition"
                >
                  <Save size={14} />
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
