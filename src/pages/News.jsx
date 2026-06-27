// src/pages/News.jsx - DEDICATED NEWS PAGE WITH IMAGE AND VIDEO UPLOAD SUPPORT
import React, { useState, useEffect } from 'react';
import { getNewsByHall, getPersistedHalls } from '../data/mockData';
import HallSelector from '../components/HallSelector';

export default function News({ user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'hall_admin';

  const [news, setNews] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  
  // Post News modal states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState('');
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [newsHallId, setNewsHallId] = useState('1'); // used for super_admin posting when "All Halls" is active

  useEffect(() => {
    const hallId = isSuperAdmin ? selectedHall : user?.hallId;
    const hallNews = getNewsByHall(hallId);
    const sortedNews = [...hallNews].sort((a, b) => new Date(b.date) - new Date(a.date));
    setNews(sortedNews);
  }, [user, selectedHall, isSuperAdmin]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 2MB (to avoid localStorage exhaustion)
    if (file.size > 2 * 1024 * 1024) {
      alert('Selected file is too large! Please choose an image or video file under 2MB.');
      e.target.value = null; // Clear file input
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUri(reader.result);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handlePostNews = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const targetHallId = isSuperAdmin 
      ? (selectedHall || newsHallId) 
      : user?.hallId;

    if (!targetHallId) {
      alert('Please select a hall to post news.');
      return;
    }

    const allNews = JSON.parse(localStorage.getItem('snapfix_news') || '[]');
    const newPost = {
      id: 'n' + Date.now(),
      hallId: targetHallId,
      title: title.trim(),
      content: content.trim(),
      mediaUri: mediaUri || null,
      mediaType: mediaType || null,
      date: new Date().toISOString(),
      author: user?.name || 'Administrator'
    };

    const updatedNewsList = [newPost, ...allNews];
    localStorage.setItem('snapfix_news', JSON.stringify(updatedNewsList));

    // Clear and close modal
    setTitle('');
    setContent('');
    setMediaUri('');
    setMediaType('');
    setShowModal(false);

    // Refresh state
    const hallId = isSuperAdmin ? selectedHall : user?.hallId;
    const currentHallNews = updatedNewsList.filter(n => !hallId || n.hallId === hallId);
    setNews(currentHallNews.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const handleDeleteNews = (id) => {
    if (window.confirm('Are you sure you want to delete this news post?')) {
      const allNews = JSON.parse(localStorage.getItem('snapfix_news') || '[]');
      const updatedNewsList = allNews.filter(post => post.id !== id);
      localStorage.setItem('snapfix_news', JSON.stringify(updatedNewsList));

      // Refresh state
      const hallId = isSuperAdmin ? selectedHall : user?.hallId;
      const currentHallNews = updatedNewsList.filter(n => !hallId || n.hallId === hallId);
      setNews(currentHallNews.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const getHallDisplay = () => {
    if (isSuperAdmin) {
      if (selectedHall) {
        const halls = getPersistedHalls();
        const hall = halls.find(h => h.id === selectedHall);
        return hall ? hall.name : 'All Halls';
      }
      return 'All Halls';
    }
    return user?.hallName || 'Your Hall';
  };

  const halls = getPersistedHalls();

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">📰 {getHallDisplay()} News Feed</h2>
          <p className="page-subtitle">Announcements, notices, and updates regarding the hall</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="hall-badge">
            <span className="hall-tag">🏛️ {getHallDisplay()}</span>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Post Announcement
            </button>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <HallSelector 
          selectedHall={selectedHall} 
          onSelectHall={setSelectedHall} 
        />
      )}

      {/* News Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '24px',
        marginTop: '24px'
      }} className="dashboard-layout-grid">
        {news.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '80px 24px',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            color: '#6B7280'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📰</span>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>No Announcements</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>There are no news updates posted for this hall yet.</p>
          </div>
        ) : (
          news.map((item) => (
            <div 
              key={item.id} 
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', lineHeight: '1.3' }}>
                    {item.title}
                  </h3>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteNews(item.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 10px', fontSize: '12px', background: '#FEF2F2', color: '#EF4444' }}
                      title="Delete Announcement"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                {/* Content */}
                <p style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '14px', 
                  color: '#4B5563', 
                  lineHeight: '1.6', 
                  whiteSpace: 'pre-wrap' 
                }}>
                  {item.content}
                </p>

                {/* Media (Image or Video) */}
                {item.mediaUri && (
                  <div style={{ marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', background: '#F9FAFB' }}>
                    {item.mediaType === 'video' ? (
                      <video 
                        src={item.mediaUri} 
                        controls 
                        style={{ width: '100%', maxHeight: '350px', display: 'block', background: 'black' }} 
                      />
                    ) : (
                      <img 
                        src={item.mediaUri} 
                        alt="Announcement Media" 
                        style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', display: 'block' }} 
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#9CA3AF',
                borderTop: '1px solid #F3F4F6',
                paddingTop: '12px',
                marginTop: '16px'
              }}>
                <span>✍️ <strong>{item.author}</strong></span>
                <span>🗓️ {new Date(item.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== POST NEWS MODAL ===== */}
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
          <form onSubmit={handlePostNews} style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '550px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: '700', color: '#111827' }}>
              📰 Post Hall Announcement
            </h2>

            {/* Hall selector for Super Admin if "All Halls" is currently active */}
            {isSuperAdmin && !selectedHall && (
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Target Hall *
                </label>
                <select
                  value={newsHallId}
                  onChange={(e) => setNewsHallId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                    outline: 'none'
                  }}
                >
                  {halls.map(hall => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Title */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Block B Maintenance Completed"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                required
              />
            </div>

            {/* Content */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Content *
              </label>
              <textarea
                placeholder="Write the announcement details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="5"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>

            {/* Media Upload */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Upload Image or Video (Optional, max 2MB)
              </label>
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  color: '#4B5563',
                  padding: '6px 0'
                }}
              />
            </div>

            {/* Media Preview inside Modal */}
            {mediaUri && (
              <div style={{ marginBottom: '20px', position: 'relative', background: '#F9FAFB', borderRadius: '8px', padding: '12px' }}>
                <span style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Media Preview</span>
                {mediaType === 'video' ? (
                  <video src={mediaUri} controls style={{ width: '100%', maxHeight: '180px', borderRadius: '8px', background: 'black' }} />
                ) : (
                  <img src={mediaUri} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px' }} />
                )}
                <button 
                  type="button" 
                  onClick={() => { setMediaUri(''); setMediaType(''); }}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Post Announcement
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setContent('');
                  setMediaUri('');
                  setMediaType('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
