import React, { useState } from 'react';

export default function RealTimeAnalytics({ stats, onFilterChange, activeFilter }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const { total, pending, scheduled, resolved } = stats;

  // A ticket moves Pending -> Scheduled -> Resolved. There is no separate
  // "In Progress" state: once the hall admin books a visit the ticket is
  // scheduled, and it stays that way until the repair is done.
  const slices = [
    {
      key: 'pending',
      label: 'Pending',
      value: pending,
      color: '#B91C1C',
      bgColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
      textClass: 'text-status-critical-text',
      icon: 'info'
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      value: scheduled,
      color: '#C2410C',
      bgColor: 'rgba(234, 88, 12, 0.08)',
      borderColor: 'rgba(234, 88, 12, 0.2)',
      textClass: 'text-status-scheduled-text',
      icon: 'calendar_today'
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: resolved,
      color: '#047857',
      bgColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
      textClass: 'text-status-success-text',
      icon: 'check_circle'
    }
  ];

  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ~376.99
  
  let currentOffset = 0;
  const processedSlices = slices.map(slice => {
    const percentage = total > 0 ? (slice.value / total) * 100 : 0;
    const strokeLength = (percentage / 100) * circumference;
    const strokeOffset = currentOffset;
    currentOffset -= strokeLength; // offset updates negatively because stroke-dashoffset moves in negative direction clockwise/counter-clockwise in SVG
    return {
      ...slice,
      percentage,
      strokeLength,
      strokeOffset
    };
  });

  const handleSliceClick = (key) => {
    if (onFilterChange) {
      if (activeFilter === key) {
        onFilterChange(null); // Clear filter if clicking same slice
      } else {
        onFilterChange(key);
      }
    }
  };

  const getActiveSliceInfo = () => {
    if (hoveredSlice) {
      const slice = processedSlices.find(s => s.key === hoveredSlice);
      return {
        label: slice.label,
        value: slice.value,
        percentage: slice.percentage.toFixed(1) + '%'
      };
    }
    return {
      label: 'Total Raised',
      value: total,
      percentage: '100%'
    };
  };

  const activeInfo = getActiveSliceInfo();

  return (
    <div className="premium-card p-6 md:p-8 animate-fade-in-up">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-light pb-4 mb-6 gap-4">
        <div>
          <h3 className="font-title-md text-title-md font-bold uppercase tracking-wider text-deep-charcoal flex items-center gap-2">
            <span className="material-symbols-outlined text-deep-charcoal">query_stats</span>
            Real-Time Ticket Distribution
          </h3>
          <p className="text-secondary font-body-sm mt-0.5">
            Click on any segment to filter the log view. Hover slices for details.
          </p>
        </div>
        {/* Real-time Status Pulse Indicator */}
        <div className="flex items-center gap-2 bg-surface-low border border-border-medium px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-deep-charcoal shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success-text opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success-text"></span>
          </span>
          Live Sync
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left/Center: SVG Donut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[180px] h-[180px]">
            <svg 
              viewBox="0 0 160 160" 
              className="w-full h-full transform -rotate-90 select-none"
            >
              {/* Drop Shadow Filter */}
              <defs>
                <filter id="donutShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
                </filter>
              </defs>

              {/* Background Empty Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="var(--surface-mid)"
                strokeWidth="16"
              />

              {total > 0 ? (
                processedSlices.map((slice) => {
                  if (slice.value === 0) return null;
                  const isHovered = hoveredSlice === slice.key;
                  const isActive = activeFilter === slice.key;
                  const isAnyActive = activeFilter !== null;
                  
                  return (
                    <circle
                      key={slice.key}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered || isActive ? '20' : '16'}
                      strokeDasharray={`${slice.strokeLength} ${circumference}`}
                      strokeDashoffset={slice.strokeOffset}
                      strokeLinecap="round"
                      className="transition-all duration-300 cursor-pointer origin-center"
                      style={{
                        filter: isHovered || isActive ? 'url(#donutShadow)' : 'none',
                        opacity: isAnyActive && !isActive && !isHovered ? 0.35 : 1,
                        transform: isHovered || isActive ? 'scale(1.02)' : 'scale(1)'
                      }}
                      onMouseEnter={() => setHoveredSlice(slice.key)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => handleSliceClick(slice.key)}
                    />
                  );
                })
              ) : (
                /* Segment Placeholder when total = 0 */
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth="16"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset="0"
                />
              )}
            </svg>

            {/* Inner Dashboard Core Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                {activeInfo.label}
              </span>
              <span className="text-3xl font-extrabold text-deep-charcoal tracking-tight mt-0.5 animate-fade-in">
                {activeInfo.value}
              </span>
              <span className="text-[10px] font-semibold text-secondary mt-0.5">
                {total > 0 ? activeInfo.percentage : 'Empty'}
              </span>
            </div>
          </div>
          
          {activeFilter && (
            <button 
              onClick={() => onFilterChange(null)}
              className="mt-4 outline-btn text-[10px] py-1 px-3 border-dashed flex items-center gap-1 hover:border-solid hover:bg-surface-high transition-all"
            >
              <span className="material-symbols-outlined text-[12px]">filter_alt_off</span>
              Clear Filter
            </button>
          )}
        </div>

        {/* Right Panel: Horizontal Bar Chart & Legend */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-4">
            {processedSlices.map((slice) => {
              const isHovered = hoveredSlice === slice.key;
              const isActive = activeFilter === slice.key;
              const isAnyActive = activeFilter !== null;
              
              return (
                <div 
                  key={slice.key}
                  className={`premium-card p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 cursor-pointer transition-all duration-200 border ${
                    isActive 
                      ? 'border-deep-charcoal bg-surface-low shadow-sm' 
                      : isHovered 
                      ? 'border-border-dark bg-surface-low' 
                      : 'border-border-light bg-surface-white'
                  }`}
                  style={{
                    opacity: isAnyActive && !isActive ? 0.6 : 1
                  }}
                  onMouseEnter={() => setHoveredSlice(slice.key)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() => handleSliceClick(slice.key)}
                >
                  {/* Status Info / Icon */}
                  <div className="flex items-center gap-3 min-w-[130px]">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ backgroundColor: slice.bgColor, border: `1px solid ${slice.borderColor}` }}
                    >
                      <span className={`material-symbols-outlined ${slice.textClass} text-[18px]`}>
                        {slice.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[13px] text-deep-charcoal leading-none">
                        {slice.label}
                      </h4>
                      <span className="text-[10px] text-secondary font-medium">
                        {slice.value} {slice.value === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart representation */}
                  <div className="flex-1 w-full flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-surface-mid rounded-full overflow-hidden relative">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${slice.percentage}%`, 
                          backgroundColor: slice.color,
                          boxShadow: isHovered || isActive ? `0 0 10px ${slice.color}80` : 'none'
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-deep-charcoal text-right w-10">
                      {slice.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
