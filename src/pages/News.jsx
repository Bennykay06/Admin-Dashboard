// src/pages/News.jsx - DEDICATED NEWS PAGE WITH IMAGE AND VIDEO UPLOAD SUPPORT
import React, { useState, useEffect } from 'react';
import { getNewsByHall, getPersistedHalls } from '../data/mockData';

export default function News({ user }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'hall_admin';

  const [news, setNews] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [halls, setHalls] = useState([]);
  
  // Post News modal states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState('');
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [newsHallId, setNewsHallId] = useState('all'); // used for super_admin posting when "All Halls" is active

  // Load halls and initial news
  useEffect(() => {
    setHalls(getPersistedHalls());
  }, []);

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
    if (!isAdmin) {
      alert('Technicians and non-admins are not allowed to post announcements.');
      return;
    }
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
    const currentHallNews = updatedNewsList.filter(n => !hallId || String(n.hallId) === String(hallId) || String(n.hallId) === 'all');
    setNews(currentHallNews.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const handleDeleteNews = (id) => {
    if (window.confirm('Are you sure you want to delete this news post?')) {
      const allNews = JSON.parse(localStorage.getItem('snapfix_news') || '[]');
      const updatedNewsList = allNews.filter(post => post.id !== id);
      localStorage.setItem('snapfix_news', JSON.stringify(updatedNewsList));

      // Refresh state
      const hallId = isSuperAdmin ? selectedHall : user?.hallId;
      const currentHallNews = updatedNewsList.filter(n => !hallId || String(n.hallId) === String(hallId) || String(n.hallId) === 'all');
      setNews(currentHallNews.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const getHallName = (hallId) => {
    if (String(hallId) === 'all') return 'All Halls';
    const found = halls.find(h => String(h.id) === String(hallId));
    return found ? found.name : 'All Halls';
  };

  const getInitials = (name) => {
    if (!name) return 'SA';
    const parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0].slice(0, 2);
  };

  return (
    <div className="font-body-md">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h2 className="font-headline-xl text-headline-xl font-bold text-deep-charcoal tracking-tight">Announcements</h2>
          <p className="text-secondary font-body-lg mt-1">Official updates, alerts and notices regarding KNUST campus</p>
        </div>
        <div className="flex gap-4">
          {isAdmin && (
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-deep-charcoal text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-sm"
              onClick={() => setShowModal(true)}
            >
              <span className="material-symbols-outlined text-[20px]">campaign</span>
              Post Announcement
            </button>
          )}
        </div>
      </header>

      {/* Hall Filter Tabs (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="mb-10 overflow-x-auto thin-scrollbar pb-4 border-b border-black/10">
          <div className="flex gap-4 min-w-max">
            <button 
              onClick={() => setSelectedHall(null)}
              className={`px-6 py-2 font-label-md text-label-md uppercase tracking-widest transition-all rounded-lg ${
                !selectedHall 
                  ? 'bg-black text-white' 
                  : 'bg-white border border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              All Halls
            </button>
            {halls.map((hall) => (
              <button 
                key={hall.id}
                onClick={() => setSelectedHall(Number(hall.id))}
                className={`px-6 py-2 font-label-md text-label-md uppercase tracking-widest transition-all rounded-lg ${
                  selectedHall === Number(hall.id) 
                    ? 'bg-black text-white' 
                    : 'bg-white border border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                {hall.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-outline-variant/30 rounded-xl text-secondary">
            <span className="material-symbols-outlined text-4xl text-secondary/40 mb-2">newspaper</span>
            <p className="font-bold text-deep-charcoal">No Announcements</p>
            <p className="text-sm">There are no updates posted for this selection yet.</p>
          </div>
        ) : (
          news.map((item) => (
            <article 
              key={item.id} 
              className="bg-white border border-outline-variant/30 rounded-xl overflow-hidden group hover:border-deep-charcoal hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Media Preview (or fallback) */}
              <div className="relative h-48 bg-surface-container-high transition-all duration-300">
                {item.mediaUri ? (
                  item.mediaType === 'video' ? (
                    <video 
                      src={item.mediaUri} 
                      className="w-full h-full object-cover"
                      muted
                      disabled
                    />
                  ) : (
                    <img 
                      src={item.mediaUri} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center border-b border-outline-variant/10 text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-4xl mb-1">campaign</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Media Attached</span>
                  </div>
                )}
                
                {/* Delete button (Admins only) */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={() => handleDeleteNews(item.id)}
                      className="bg-white/90 backdrop-blur-sm p-2 rounded-lg text-deep-charcoal hover:bg-error hover:text-white transition-colors shadow-sm"
                      title="Delete Announcement"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                )}

                {/* Hall Tag */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="bg-deep-charcoal text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                    {getHallName(item.hallId)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-title-md text-title-md text-on-surface mb-3 group-hover:underline transition-all line-clamp-2">
                  {item.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-4 mb-6">
                  {item.content}
                </p>
                
                {/* Author Info */}
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-deep-charcoal flex items-center justify-center text-white text-[10px] font-bold">
                      {getInitials(item.author)}
                    </div>
                    <span className="text-label-sm text-on-surface font-semibold text-xs">{item.author}</span>
                  </div>
                  <span className="text-label-sm text-on-surface-variant/60 text-xs">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ===== POST NEWS MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handlePostNews}
            className="bg-white border border-outline rounded-xl p-8 max-w-xl w-full flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-headline-md text-headline-md text-deep-charcoal mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">campaign</span>
              Post Hall Announcement
            </h2>

            {/* Target Hall (Super Admin only, if not filtering) */}
            {isSuperAdmin && !selectedHall && (
              <div className="space-y-1.5 mb-4">
                <label className="font-label-md text-black/60 block text-xs">Target Hall *</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all appearance-none cursor-pointer"
                    value={newsHallId}
                    onChange={(e) => setNewsHallId(e.target.value)}
                    required
                  >
                    <option value="all">All Halls (Broadcast)</option>
                    {halls.map(hall => (
                      <option key={hall.id} value={hall.id}>{hall.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5 mb-4">
              <label className="font-label-md text-black/60 block text-xs">Title *</label>
              <input
                type="text"
                placeholder="e.g., Scheduled Water Supply Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all text-sm font-semibold"
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5 mb-4">
              <label className="font-label-md text-black/60 block text-xs">Content *</label>
              <textarea
                placeholder="Write the announcement details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="5"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all text-sm"
                required
              />
            </div>

            {/* File Upload */}
            <div className="space-y-1.5 mb-6">
              <label className="font-label-md text-black/60 block text-xs">Upload Image or Video (Optional, max 2MB)</label>
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 font-body-md focus:border-black outline-none transition-all text-xs"
              />
            </div>

            {/* Media Preview inside Modal */}
            {mediaUri && (
              <div className="mb-6 relative bg-surface-container-low border border-outline-variant rounded-lg p-3">
                <span className="block mb-2 text-xs font-bold text-secondary">Media Preview</span>
                {mediaType === 'video' ? (
                  <video src={mediaUri} controls className="w-full max-h-[180px] rounded bg-black" />
                ) : (
                  <img src={mediaUri} alt="Preview" className="w-full max-h-[180px] object-contain rounded" />
                )}
                <button 
                  type="button" 
                  onClick={() => { setMediaUri(''); setMediaType(''); }}
                  className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 mt-4">
              <button 
                type="submit" 
                className="flex-1 py-3 bg-deep-charcoal text-white rounded-lg font-semibold hover:bg-black transition-all shadow-sm"
              >
                Post Announcement
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setContent('');
                  setMediaUri('');
                  setMediaType('');
                }}
                className="flex-1 py-3 border border-outline text-secondary rounded-lg font-semibold hover:bg-surface-container-low transition-colors"
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

