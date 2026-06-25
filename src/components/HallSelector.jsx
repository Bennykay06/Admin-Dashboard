import React from 'react';
import { halls } from '../data/mockData';

export default function HallSelector({ selectedHall, onSelectHall }) {
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