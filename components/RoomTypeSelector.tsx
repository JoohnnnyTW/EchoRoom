
import React from 'react';
import { PromptTerm } from '../types'; // Changed InitialPromptTerm to PromptTerm

interface RoomTypeSelectorProps {
  roomTypes: PromptTerm[]; // Changed InitialPromptTerm to PromptTerm
  selectedRoomType: PromptTerm | null; // Changed InitialPromptTerm to PromptTerm
  onSelect: (roomType: PromptTerm) => void; // Changed InitialPromptTerm to PromptTerm
}

export const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({ roomTypes, selectedRoomType, onSelect }) => {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-700 mb-2">空間類型</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {roomTypes.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            className={`p-2.5 text-xs rounded-lg border text-center transition-all duration-150 ease-in-out
                        ${selectedRoomType?.id === room.id
                          ? 'bg-black text-white border-black shadow-md scale-105'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none'
                        }`}
            aria-pressed={selectedRoomType?.id === room.id}
          >
            {room.termEn}
            <span className={`block text-[10px] ${selectedRoomType?.id === room.id ? 'text-gray-300' : 'text-gray-400'}`}>
                {room.termZh}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
