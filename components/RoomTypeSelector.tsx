
import React from 'react';
import { PromptTerm, RoomTypeSelectorProps } from '../types';
import { PlusCircleIcon, SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon, TrashIcon } from './Icons'; // Added TrashIcon
import { LoadingSpinner } from './LoadingSpinner';
import { IconButton } from './IconButton'; // Assuming IconButton exists

export const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({ 
  roomTypes, 
  selectedRoomType, 
  onSelect, 
  title,
  isEnabled,
  onToggleEnable,
  onShowAddRoomTypeModal,
  onGenerateNewRoomTypeSet,
  isLoadingAIRoomTypeSet,
  aiRoomTypeSetError,
  geminiApiKeySet,
  thinkingMessages,
  currentThinkingIndex,
  buttonLabelFromAI,
  onDeleteRoomType, // New prop
}) => {
  const showThinkingProcess = isLoadingAIRoomTypeSet && thinkingMessages.length > 0 && !aiRoomTypeSetError;

  const handleDelete = (e: React.MouseEvent, room: PromptTerm) => {
    e.stopPropagation(); // Prevent selection when clicking delete
    const confirmMessage = `您確定要刪除空間類型「${room.termZh} (${room.termEn})」嗎？\n此操作會將其從目前設定中移除。若要復原，需重設空間類型或整體應用程式設定至預設值。`;
    if (window.confirm(confirmMessage)) {
      onDeleteRoomType(room.id);
    }
  };

  return (
    <div className={`p-4 bg-white rounded-xl shadow-lg border border-gray-200 transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-70'}`}>
      <div className={`flex justify-between items-center ${isEnabled ? 'mb-3' : ''} transition-all duration-300`}>
        <h2 className="text-md font-semibold text-gray-900/90">{title}</h2>
        <label htmlFor="toggleRoomTypeSelector" className="flex items-center cursor-pointer">
            <div className="relative">
                <input 
                    type="checkbox" 
                    id="toggleRoomTypeSelector" 
                    className="sr-only" 
                    checked={isEnabled} 
                    onChange={(e) => onToggleEnable(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-black' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-full' : ''}`}></div>
            </div>
            <span className="ml-2 text-xs text-gray-600">{isEnabled ? '啟用中' : '已停用'}</span>
        </label>
      </div>
      
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isEnabled ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!isEnabled}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-2">
          {roomTypes.map((room) => (
            <div key={room.id} className="relative group">
              <button
                onClick={() => onSelect(room)}
                className={`w-full p-2.5 text-xs rounded-lg border text-center transition-all duration-150 ease-in-out active:scale-95 transform
                            ${selectedRoomType?.id === room.id
                              ? 'bg-black text-white border-black shadow-md scale-105'
                              : `bg-white text-gray-800 border-gray-300 hover:border-gray-500 hover:shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none ${room.isCustom ? 'border-dashed border-blue-400' : (room.id.startsWith('core_roomtype_') ? 'border-green-400' : '')}`
                            }
                            ${!isEnabled ? 'cursor-not-allowed opacity-50' : ''}
                            `}
                aria-pressed={selectedRoomType?.id === room.id}
                disabled={!isEnabled}
              >
                <span className={selectedRoomType?.id === room.id ? 'text-white' : 'text-gray-900/90'}>{room.termEn}</span>
                <span className={`block text-[10px] ${selectedRoomType?.id === room.id ? 'text-gray-300' : 'text-gray-600'}`}>
                    {room.termZh}
                </span>
                {room.isCustom && !room.id.startsWith('core_roomtype_') && <span className="block text-[9px] text-gray-600">(自訂)</span>}
                {room.id.startsWith('core_roomtype_') && room.isCustom === false && <span className="block text-[9px] text-gray-600">(AI)</span>}
              </button>
              <IconButton
                onClick={(e) => handleDelete(e, room)}
                aria-label={`刪除空間類型 ${room.termZh}`}
                title={`刪除空間類型 "${room.termZh}"`}
                className="absolute top-0.5 right-0.5 p-0.5 bg-white bg-opacity-50 hover:bg-opacity-100 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 active:scale-95 transform"
                disabled={!isEnabled}
              >
                  <TrashIcon className="w-3.5 h-3.5" />
              </IconButton>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <button
                onClick={onShowAddRoomTypeModal}
                disabled={!isEnabled}
                className="w-full flex items-center justify-center px-3 py-1.5 border-2 border-dashed border-gray-300 text-xs font-medium rounded-md text-gray-800 hover:text-black hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transform duration-100"
            >
                <PlusCircleIcon className="w-4 h-4 mr-1.5" />
                新增自訂空間類型
            </button>
            <button
                onClick={onGenerateNewRoomTypeSet}
                disabled={!isEnabled || isLoadingAIRoomTypeSet || !geminiApiKeySet}
                className="w-full flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transform duration-100"
                title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : (buttonLabelFromAI)}
            >
                {isLoadingAIRoomTypeSet ? <LoadingSpinner className="w-4 h-4 mr-1.5" /> : <SparklesIcon className="w-4 h-4 mr-1.5" />}
                {isLoadingAIRoomTypeSet ? "AI 建議中..." : buttonLabelFromAI}
            </button>
            {showThinkingProcess && isEnabled && (
              <div className="my-1 p-1.5 border border-gray-100 rounded-md bg-white text-[11px]">
                  {thinkingMessages.map((message, index) => (
                    <div key={index} className={`flex items-center transition-opacity duration-300 ${index <= currentThinkingIndex ? 'opacity-100' : 'opacity-40'}`}>
                      {index < currentThinkingIndex ? <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500 shrink-0" />
                      : index === currentThinkingIndex ? <LoadingSpinner className="w-2.5 h-2.5 mr-1 text-blue-500 shrink-0" />
                      : <div className="w-3 h-3 mr-1 shrink-0 border border-gray-300 rounded-full" />}
                      <span className={`${index === currentThinkingIndex ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{message}</span>
                    </div>
                  ))}
              </div>
            )}
            {aiRoomTypeSetError && !isLoadingAIRoomTypeSet && isEnabled && (
                <div className="mt-1 p-1 bg-red-50 border border-red-300 rounded-md text-[11px] text-red-700 flex items-start">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0 mt-px"/>
                    <span>{aiRoomTypeSetError}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
