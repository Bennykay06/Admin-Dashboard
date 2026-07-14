// src/pages/Locations.jsx - UPDATED TO CAMPUS INFRASTRUCTURE SYSTEM
import React, { useState, useEffect } from 'react';
import { getPersistedHalls, savePersistedHalls } from '../data/mockData';
import { Navigate } from 'react-router-dom';

export default function Locations({ user }) {
  // ✅ All hooks must be called BEFORE any conditional returns
  const [locations, setLocations] = useState(() => getPersistedHalls());
  const [editedLocations, setEditedLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    floors: '',
    rooms: ''
  });

  // Sync editedLocations with locations state
  useEffect(() => {
    setEditedLocations(JSON.parse(JSON.stringify(locations)));
  }, [locations]);

  // ✅ Check permission AFTER all hooks are called
  if (user?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  // Compute stats in real-time based on edited inputs
  const totalHalls = editedLocations.length;
  const totalFloors = editedLocations.reduce((sum, loc) => sum + Number(loc.floors || 0), 0);
  const totalRooms = editedLocations.reduce((sum, loc) => sum + Number(loc.rooms || 0), 0);

  // Icon mapping for halls
  const getHallIcon = (index, code) => {
    const icons = ['domain', 'castle', 'account_balance', 'corporate_fare', 'location_city', 'apartment'];
    return icons[index % icons.length];
  };

  const handleInputChange = (id, field, value) => {
    setEditedLocations(prev =>
      prev.map(loc => (loc.id === id ? { ...loc, [field]: value } : loc))
    );
  };

  const handleDiscard = () => {
    // Reset to last saved locations
    setEditedLocations(JSON.parse(JSON.stringify(locations)));
  };

  const handleSaveChanges = () => {
    // Save the global inputs to persistent storage
    savePersistedHalls(editedLocations);
    setLocations(editedLocations);
    alert('Global infrastructure changes saved successfully!');
  };

  const handleAddLocation = () => {
    setFormData({ name: '', code: '', floors: '', rooms: '' });
    setShowModal(true);
  };

  const handleDeleteLocation = (id) => {
    if (window.confirm('Are you sure you want to delete this hall from the system?')) {
      const updated = locations.filter(loc => loc.id !== id);
      setLocations(updated);
      savePersistedHalls(updated);
    }
  };

  const handleSaveNewLocation = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Please fill in all required fields');
      return;
    }

    const newLocation = {
      id: Date.now().toString(),
      name: formData.name,
      code: formData.code.toLowerCase().trim(),
      floors: Number(formData.floors || 0),
      rooms: Number(formData.rooms || 0)
    };

    const updated = [...locations, newLocation];
    setLocations(updated);
    savePersistedHalls(updated);
    setShowModal(false);
  };

  return (
    <div className="font-headline-md min-h-screen bg-background text-on-surface p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-outline-variant pb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-deep-charcoal">Infrastructure Control</h2>
          <p className="font-body-md text-body-md text-secondary">Global overview of residential capacity and layout.</p>
        </div>
        <div className="hall-badge">
          <span className="hall-tag font-label-md bg-deep-charcoal text-surface">🏛️ Super Admin Controller</span>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Total Halls */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-deep-charcoal text-white rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <p className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-2">Total Halls</p>
            <p className="font-headline-xl text-headline-xl text-deep-charcoal">
              {String(totalHalls).padStart(2, '0')}
            </p>
          </div>

          {/* Total Floors */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-deep-charcoal text-white rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined">layers</span>
            </div>
            <p className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-2">Total Floors</p>
            <p className="font-headline-xl text-headline-xl text-deep-charcoal">
              {String(totalFloors).padStart(2, '0')}
            </p>
          </div>

          {/* Total Rooms */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-deep-charcoal text-white rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined">meeting_room</span>
            </div>
            <p className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-2">Total Rooms</p>
            <p className="font-headline-xl text-headline-xl text-deep-charcoal">
              {totalRooms.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Edit Data Section */}
      <section className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-title-md text-title-md text-deep-charcoal">Edit Infrastructure Data</h4>
          <div className="flex gap-3">
            <button 
              onClick={handleDiscard}
              className="px-4 py-2 border border-outline text-secondary rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleSaveChanges}
              className="px-6 py-2 bg-deep-charcoal text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-all shadow-sm"
            >
              Save Global Changes
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant">
            <p className="font-body-md text-body-md text-secondary mb-6">
              Update the structural metrics for each residence hall. Changes here will sync across the entire management system.
            </p>
            
            <div className="space-y-6">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-outline-variant font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                <div className="col-span-5">Hall Name</div>
                <div className="col-span-3 text-center">Floors</div>
                <div className="col-span-3 text-center">Rooms Per Hall</div>
                <div className="col-span-1"></div>
              </div>

              {/* Rows */}
              {editedLocations.length === 0 ? (
                <div className="text-center py-8 text-secondary font-body-md">
                  No halls currently registered in infrastructure.
                </div>
              ) : (
                editedLocations.map((hall, index) => (
                  <div key={hall.id} className="grid grid-cols-12 gap-4 items-center group">
                    {/* Hall Name input (inline edit) */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-deep-charcoal">
                        <span className="material-symbols-outlined text-[18px]">
                          {getHallIcon(index, hall.code)}
                        </span>
                      </div>
                      <input 
                        className="bg-transparent border-none p-0 font-title-md text-deep-charcoal focus:ring-0 w-full focus:border-b focus:border-deep-charcoal focus:outline-none" 
                        type="text" 
                        value={hall.name}
                        onChange={(e) => handleInputChange(hall.id, 'name', e.target.value)}
                      />
                    </div>

                    {/* Floors input */}
                    <div className="col-span-3 flex justify-center">
                      <input 
                        className="w-16 text-center border border-outline-variant rounded p-1.5 font-label-md text-label-md focus:border-deep-charcoal focus:ring-1 focus:ring-deep-charcoal bg-transparent text-deep-charcoal" 
                        type="number" 
                        value={hall.floors}
                        onChange={(e) => handleInputChange(hall.id, 'floors', e.target.value)}
                      />
                    </div>

                    {/* Rooms input */}
                    <div className="col-span-3 flex justify-center">
                      <input 
                        className="w-24 text-center border border-outline-variant rounded p-1.5 font-label-md text-label-md focus:border-deep-charcoal focus:ring-1 focus:ring-deep-charcoal bg-transparent text-deep-charcoal" 
                        type="number" 
                        value={hall.rooms}
                        onChange={(e) => handleInputChange(hall.id, 'rooms', e.target.value)}
                      />
                    </div>

                    {/* Row delete action */}
                    <div className="col-span-1 text-right">
                      <button 
                        onClick={() => handleDeleteLocation(hall.id)}
                        className="text-error hover:text-red-700 transition-colors"
                        title="Delete Hall"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Register Action */}
          <div className="p-4 bg-surface-container-low flex justify-center">
            <button 
              onClick={handleAddLocation}
              className="flex items-center gap-2 font-label-md text-label-md hover:underline transition-all text-deep-charcoal font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Register New Hall to Infrastructure
            </button>
          </div>
        </div>
      </section>

      {/* Register Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <form onSubmit={handleSaveNewLocation} style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 className="font-headline-md text-headline-md text-deep-charcoal mb-6">
              ➕ Register New Hall
            </h2>

            <div className="form-group mb-4">
              <label className="block text-sm font-semibold text-deep-charcoal mb-1">Hall Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Unity Hall"
                className="w-full border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-deep-charcoal focus:ring-1 focus:ring-deep-charcoal focus:outline-none"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="block text-sm font-semibold text-deep-charcoal mb-1">Hall Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., unity"
                className="w-full border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-deep-charcoal focus:ring-1 focus:ring-deep-charcoal focus:outline-none"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="block text-sm font-semibold text-deep-charcoal mb-1">Number of Floors</label>
              <input
                type="number"
                value={formData.floors}
                onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                placeholder="e.g., 5"
                className="w-full border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-deep-charcoal focus:ring-1 focus:ring-deep-charcoal focus:outline-none"
              />
            </div>

            <div className="form-group mb-6">
              <label className="block text-sm font-semibold text-deep-charcoal mb-1">Number of Rooms</label>
              <input
                type="number"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                placeholder="e.g., 50"
                className="w-full border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-deep-charcoal focus:ring-1 focus:ring-deep-charcoal focus:outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" 
                className="flex-1 py-3 bg-deep-charcoal text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-all shadow-sm font-semibold"
              >
                Register Hall
              </button>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-3 border border-outline text-secondary rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}