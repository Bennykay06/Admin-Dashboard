// src/pages/Staff.jsx - HALL ADMIN ACCOUNT MANAGEMENT
//
// The technician role was removed from this app (see
// remove_technician_role.sql), which also removed hall admins' ability to
// manage their own staff — the only account this page can still create is
// a hall_admin, and only a super admin may do that. App.js now restricts
// this route to super_admin.
import React, { useState, useEffect } from 'react';
import {
  getPersistedStaff,
  getPersistedHalls,
  useStoreVersion,
  createStaffAccount,
  updateStaffProfile,
  setStaffPassword,
  deleteStaffAccount
} from '../data/mockData';

// Copy helper that works outside secure contexts (e.g. http:// on a LAN IP),
// where navigator.clipboard is undefined. Falls back to a hidden textarea.
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    alert(ok ? 'Copied to clipboard!' : 'Could not copy. Please copy manually.');
  } catch {
    alert('Could not copy. Please copy manually.');
  }
}

const roleLabel = (role) => (role === 'super_admin' ? 'Super Admin' : 'Hall Admin');

export default function Staff({ user }) {
  // The store keeps an `isActive` boolean (mirroring the profiles.is_active
  // column); this page was written against a `status: 'active'|'inactive'`
  // string that the store never provided, so every active/inactive check
  // below silently compared against undefined. Deriving it here once keeps
  // the rest of the page unchanged while fixing that mismatch.
  const withStatus = (list) => list.map((m) => ({ ...m, status: m.isActive ? 'active' : 'inactive' }));

  const version = useStoreVersion();
  const [staff, setStaff] = useState(() => withStatus(getPersistedStaff()));
  const [halls, setHalls] = useState(() => getPersistedHalls());

  useEffect(() => {
    setHalls(getPersistedHalls());
    setStaff(withStatus(getPersistedStaff()));
  }, [version]);

  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    hallId: '',
    status: 'active',
    password: ''
  });

  // ===== ADD STAFF =====
  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      hallId: '',
      status: 'active',
      password: ''
    });
    setShowModal(true);
  };

  // ===== EDIT STAFF =====
  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      hallId: staffMember.hallId || '',
      status: staffMember.status,
      password: ''
    });
    setShowModal(true);
  };

  // ===== DELETE STAFF =====
  // Deletes the real Supabase Auth account + profile, not just the row in
  // this page's local state.
  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    const res = await deleteStaffAccount(id);
    if (res?.error) {
      alert('Error deleting staff account: ' + res.error);
    }
  };

  // ===== SAVE STAFF (Add or Update) =====
  const handleSaveStaff = async () => {
    if (!formData.name) {
      alert('Please fill in Name');
      return;
    }
    if (!formData.hallId) {
      alert('Please select a Residence Hall');
      return;
    }
    if (!formData.status) {
      alert('Please select a Status');
      return;
    }

    const selectedHallObj = halls.find(h => String(h.id) === String(formData.hallId));
    const hallName = selectedHallObj ? selectedHallObj.name : 'Selected Hall';
    const hallCode = selectedHallObj && selectedHallObj.code
      ? selectedHallObj.code.toLowerCase()
      : (selectedHallObj ? selectedHallObj.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'hall');

    if (editingStaff) {
      // Persist to Supabase. Role is intentionally not editable here — the
      // only role this page creates is hall_admin, and changing someone's
      // role is rare enough to not warrant a dropdown that could also
      // (mis)promote a student or a super admin.
      const res = await updateStaffProfile(editingStaff.id, {
        name: formData.name,
        hallId: formData.hallId,
        isActive: formData.status === 'active'
      });

      if (res?.error) {
        alert('Error updating staff account: ' + res.error);
        return;
      }

      setShowModal(false);
      return;
    }

    // Add new staff — always a hall_admin; create_staff_account() rejects
    // anything else now that the technician role is gone.
    if (!formData.password) {
      alert('Please enter a Password.');
      return;
    }

    // Auto-generate email: [firstname].[lastname]@[hallcode].resifix.com
    const nameParts = formData.name.trim().toLowerCase().split(/\s+/);
    const firstName = nameParts[0] || 'admin';
    const lastName = nameParts.slice(1).join('.') || 'admin';
    const email = `${firstName}.${lastName}@${hallCode}.resifix.com`;

    const res = await createStaffAccount({
      email,
      password: formData.password,
      name: formData.name,
      role: 'hall_admin',
      hallId: formData.hallId
    });

    if (res?.error) {
      alert('Error creating staff account: ' + res.error);
      return;
    }

    setGeneratedCredentials({
      name: formData.name,
      role: 'Hall Admin',
      hallName,
      email,
      password: formData.password,
      portal: `${hallName} Admin Portal`
    });

    setShowModal(false);
    setShowCredentialsModal(true);
  };

  // ===== TOGGLE STAFF STATUS =====
  const toggleStatus = async (member) => {
    const res = await updateStaffProfile(member.id, {
      isActive: member.status !== 'active'
    });
    if (res?.error) {
      alert('Error updating status: ' + res.error);
    }
  };

  // ===== RESET CREDENTIALS =====
  const handleResetCredentials = async (member) => {
    if (!window.confirm(`Are you sure you want to reset credentials for ${member.name}?`)) return;

    const newPassword = window.prompt(`Enter new password for ${member.name}:`);
    if (newPassword === null) return; // user cancelled
    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    const res = await setStaffPassword(member.id, trimmed);
    if (res?.error) {
      alert('Error resetting credentials: ' + res.error);
      return;
    }

    setGeneratedCredentials({
      name: member.name,
      role: roleLabel(member.role),
      email: member.email,
      password: trimmed,
      portal: 'Admin Portal'
    });

    setShowCredentialsModal(true);
  };


  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '', 'hall_admin', 'super_admin'
  const [hallFilter, setHallFilter] = useState(''); // '', hallId

  // This page is super_admin-only (see App.js), so every hall admin (and any
  // other super admin) is in scope — no hall-based restriction like the
  // technician-era version had.
  const displayedStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === '' || member.role === roleFilter;
    const matchesHall = hallFilter === '' || String(member.hallId) === String(hallFilter);

    return matchesSearch && matchesRole && matchesHall;
  });

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  // Metrics calculation
  const totalStaffCount = displayedStaff.length;
  const activeStaffCount = displayedStaff.filter(s => s.status === 'active').length;
  const hallAdminCount = displayedStaff.filter(s => s.role === 'hall_admin').length;
  const superAdminCount = displayedStaff.filter(s => s.role === 'super_admin').length;

  return (
    <div className="font-body-md">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight">Staff Management</h2>
          <p className="text-secondary font-body-lg mt-1">
            Institutional records for hall administrator accounts
          </p>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white border border-outline p-6 rounded shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Total Staff</p>
            <span className="material-symbols-outlined text-secondary text-lg">groups</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black italic">{totalStaffCount}</p>
            <p className="text-[10px] font-bold text-black border-b border-black uppercase">Personnel</p>
          </div>
        </div>
        <div className="bg-white border border-outline p-6 rounded shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Active On-Duty</p>
            <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black italic">{activeStaffCount}</p>
            <p className="text-[10px] font-bold text-secondary uppercase">Deployable</p>
          </div>
        </div>
        <div className="bg-white border border-outline p-6 rounded shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Hall Admins</p>
            <span className="material-symbols-outlined text-secondary text-lg">admin_panel_settings</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black italic">{hallAdminCount}</p>
            <p className="text-[10px] font-bold text-secondary uppercase">Per-Hall</p>
          </div>
        </div>
        <div className="bg-white border border-outline p-6 rounded shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Super Admins</p>
            <span className="material-symbols-outlined text-secondary text-lg">shield_person</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black italic">{superAdminCount}</p>
            <p className="text-[10px] font-bold text-secondary uppercase">Institutional</p>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-1 items-center gap-4 w-full md:max-w-2xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white border border-outline rounded-xl focus:ring-1 focus:ring-deep-charcoal focus:border-deep-charcoal outline-none transition-all text-sm font-medium"
              placeholder="Search by name or email..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-3 bg-white border border-outline rounded-xl focus:ring-1 focus:ring-deep-charcoal outline-none cursor-pointer text-sm font-medium min-w-[150px]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="hall_admin">Hall Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-3 bg-white border border-outline rounded-xl focus:ring-1 focus:ring-deep-charcoal outline-none cursor-pointer text-sm font-medium min-w-[170px]"
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
            >
              <option value="">All Residence Halls</option>
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
          </div>
        </div>

        <button
          className="flex items-center gap-2 px-6 py-3 bg-deep-charcoal text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-sm"
          onClick={handleAddStaff}
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Register New Hall Admin
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-outline rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/50 border-b border-outline">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Personnel Identifier</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Classification</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Registry Scope</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Commands</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline text-sm">
            {displayedStaff.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-secondary font-medium">
                  No staff members found. Click "Register New Hall Admin" to add one.
                </td>
              </tr>
            ) : (
              displayedStaff.map((member) => {
                const registryHall = member.hallName || 'All Halls';
                const isSuper = member.role === 'super_admin';
                const isActive = member.status === 'active';

                return (
                  <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded flex items-center justify-center font-black text-xs ${
                          isSuper ? 'bg-black text-white' : 'border-2 border-black text-black'
                        }`}>
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <span className="block font-black text-sm tracking-tight uppercase italic text-deep-charcoal">{member.name}</span>
                          <span className="block text-[10px] text-secondary font-bold uppercase tracking-tighter">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                        isSuper
                          ? 'bg-black text-white'
                          : 'border border-black text-black'
                      }`}>
                        {roleLabel(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-on-surface uppercase tracking-wide">
                      {registryHall}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => toggleStatus(member)}
                        className="flex items-center gap-2"
                        title="Toggle status"
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-black' : 'border border-black bg-white'}`}></span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-black' : 'text-secondary'}`}>
                          {isActive ? 'Active On-Duty' : 'Off-Duty / Leave'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button
                        className="p-2 hover:bg-black hover:text-white rounded transition-all border border-transparent text-secondary"
                        onClick={() => handleEditStaff(member)}
                        title="Edit Details"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit_note</span>
                      </button>
                      <button
                        className="p-2 hover:bg-black hover:text-white rounded transition-all border border-transparent text-secondary"
                        onClick={() => handleResetCredentials(member)}
                        title="Reset Password"
                      >
                        <span className="material-symbols-outlined text-[20px]">shield_person</span>
                      </button>
                      <button
                        className="p-2 hover:bg-black hover:text-white rounded transition-all border border-transparent text-secondary hover:text-error"
                        onClick={() => handleDeleteStaff(member.id)}
                        title="Delete Personnel"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>


      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-deep-charcoal mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">{editingStaff ? 'edit' : 'person_add'}</span>
              {editingStaff ? 'Edit Staff' : 'Add New Hall Admin'}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black/60 block ml-0.5">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="w-full premium-input"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black/60 block ml-0.5">Hall *</label>
                <div className="relative">
                  <select
                    value={formData.hallId}
                    onChange={(e) => setFormData({ ...formData, hallId: e.target.value })}
                    className="w-full premium-select appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Residence Hall</option>
                    {halls.map((hall) => (
                      <option key={hall.id} value={hall.id}>
                        {hall.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black/60 block ml-0.5">Role</label>
                <div className="w-full premium-input bg-surface-low text-secondary">
                  {editingStaff ? roleLabel(editingStaff.role) : 'Hall Admin'}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black/60 block ml-0.5">Status</label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full premium-select appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                </div>
              </div>

              {!editingStaff && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-black/60 block ml-0.5">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter initial password"
                    className="w-full premium-input"
                    autoComplete="new-password"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 py-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-sm transition-all shadow-sm"
                onClick={handleSaveStaff}
              >
                {editingStaff ? 'Update Staff' : 'Add Staff'}
              </button>
              <button
                className="flex-1 py-3 border border-border-medium text-secondary rounded-lg font-bold text-sm hover:bg-surface-low transition-colors"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREDENTIALS GENERATION DISPLAY MODAL ===== */}
      {showCredentialsModal && generatedCredentials && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white border border-border-medium rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-deep-charcoal text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">key</span>
            </div>
            <h2 className="text-xl font-bold text-deep-charcoal mb-2">
              Credentials Generated!
            </h2>
            <p className="text-xs text-secondary mb-6">
              Account created. Share these credentials for them to sign in.
            </p>

            <div className="bg-surface-low border border-border-medium rounded-lg p-5 text-left mb-6 space-y-4">
              <div>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">Name</span>
                <span className="text-sm font-semibold text-deep-charcoal">{generatedCredentials.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">Role</span>
                <span className="text-sm font-semibold text-deep-charcoal">{generatedCredentials.role}</span>
              </div>
              {generatedCredentials.hallName && (
                <div>
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">Assigned Hall</span>
                  <span className="text-sm font-semibold text-deep-charcoal">{generatedCredentials.hallName}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">Email Address</span>
                <span className="text-sm font-mono font-bold text-deep-charcoal">{generatedCredentials.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">Temporary Password</span>
                <span className="text-sm font-mono font-bold text-deep-charcoal">{generatedCredentials.password}</span>
              </div>
              {generatedCredentials.portal && (
                <div>
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-0.5">Sign In Via</span>
                  <span className="text-sm font-semibold text-deep-charcoal">{generatedCredentials.portal}</span>
                </div>
              )}
            </div>

            {/* Password Reset Link Generation & Sharing Section */}
            {(() => {
              const resetToken = btoa(JSON.stringify({
                email: generatedCredentials.email,
                expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
              }));
              const resetLink = `${window.location.origin}/login?reset=true&token=${resetToken}`;
              const shareMessage = `Hi ${generatedCredentials.name},\n\nYour account on the KNUST Campus Facilities Admin Portal has been created.\n\n*Credentials*:\nRole: ${generatedCredentials.role}\nEmail: ${generatedCredentials.email}\nTemporary Password: ${generatedCredentials.password}\n\n*Password Reset Link (Expires in 30 minutes)*:\n${resetLink}\n\nPlease reset your password immediately upon clicking this link.`;
              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

              return (
                <div className="space-y-6">
                  <div className="border-t border-border-medium pt-5 text-left space-y-2">
                    <span className="text-[10px] text-status-critical-text font-bold uppercase tracking-widest block">
                      ⏳ Password Reset Link (Expires in 30m)
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={resetLink}
                        className="flex-1 px-3 py-2 bg-status-critical-bg border border-status-critical-border rounded-lg text-xs font-mono text-status-critical-text outline-none select-all"
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        type="button"
                        className="outline-btn py-2 px-3 text-xs"
                        onClick={() => {
                          copyToClipboard(resetLink);
                        }}
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      className="w-full py-3 bg-black hover:bg-neutral-900 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                      onClick={() => {
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.008c6.56 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                      </svg>
                      Share on WhatsApp
                    </button>

                    <button
                      className="w-full py-3 border border-border-medium hover:bg-surface-low text-secondary rounded-lg font-bold text-sm transition-colors"
                      onClick={() => {
                        setShowCredentialsModal(false);
                        setGeneratedCredentials(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
