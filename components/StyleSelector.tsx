import React, { useState } from 'react';
import { DesignStyle } from '../types';
import { ChevronDownIcon, ChevronUpIcon, PlusCircleIcon } from './Icons';

interface StyleSelectorProps {
  styles: DesignStyle[];
  selectedStyle: DesignStyle | null;
  onSelect: (style: DesignStyle) => void;
  onShowAddStyleModal: () => void; // Callback to open the add style modal
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ styles, selectedStyle, onSelect, onShowAddStyleModal }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <div className="flex items-center justify-between p-3 text-left text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75 rounded-t-lg border border-b-0 border-gray-200">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full"
            aria-expanded={isOpen}
            aria-controls="style-selector-content"
        >
            <span>選擇設計風格</span>
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
        </button>
      </div>
      
      {isOpen && (
        <div id="style-selector-content" className="p-3 border border-t-0 border-gray-200 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => onSelect(style)}
                className={`p-3 text-xs md:text-sm rounded-lg border text-center transition-all duration-150 ease-in-out
                            ${selectedStyle?.id === style.id 
                              ? 'bg-black text-white border-black shadow-lg scale-105' 
                              : `bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:shadow-md focus:ring-2 focus:ring-gray-500 focus:outline-none ${style.isCustom ? 'border-dashed border-gray-400' : ''}`
                            }`}
                aria-pressed={selectedStyle?.id === style.id}
              >
                {style.nameEn}
                <span className={`block text-[10px] ${selectedStyle?.id === style.id ? 'text-gray-300' : 'text-gray-400'}`}>
                    {style.nameZh}
                </span>
                {style.isCustom && <span className="block text-[9px] text-blue-500">(自訂)</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="p-3 border border-t-0 border-gray-200 rounded-b-lg bg-white">
        <button
            onClick={onShowAddStyleModal}
            className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-600 hover:text-black hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors"
        >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            新增自訂風格
        </button>
      </div>
    </div>
  );
};