import React from 'react';
import { getPersistedHalls, useStoreVersion } from '../data/mockData';

export default function HallSelector({ selectedHall, onSelectHall }) {
  // Halls come from the database now rather than a static array, so this
  // re-renders if the super admin adds or renames one.
  useStoreVersion();
  const halls = getPersistedHalls();

  return (
    <div className="hall-selector">
      <button
        className={`hall-btn ${!selectedHall ? 'active' : ''}`}
        onClick={() => onSelectHall(null)}
      >
        🏛️ All Halls
      </button>
      {halls.map((hall) => (
        <button
          key={hall.id}
          className={`hall-btn ${selectedHall === hall.id ? 'active' : ''}`}
          onClick={() => onSelectHall(hall.id)}
        >
          {hall.name}
        </button>
      ))}
    </div>
  );
}
