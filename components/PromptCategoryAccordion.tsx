import React from 'react';
import { PromptCategory, PromptTerm, SelectedPromptTerm } from '../types'; // Updated InitialPromptTerm to PromptTerm
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, PlusCircleIcon } from './Icons';

interface PromptCategoryAccordionProps {
  category: PromptCategory;
  selectedTerms: Map<string, SelectedPromptTerm>;
  onToggleTerm: (term: PromptTerm) => void; // Updated to PromptTerm
  isOpen: boolean;
  onToggle: () => void;
  onShowAddCustomTermModal: (categoryId: string, categoryName: string) => void; // New prop
}

export const PromptCategoryAccordion: React.FC<PromptCategoryAccordionProps> = ({ 
  category, 
  selectedTerms, 
  onToggleTerm,
  isOpen,
  onToggle,
  onShowAddCustomTermModal 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75"
        aria-expanded={isOpen}
        aria-controls={`category-panel-${category.id}`}
      >
        <span>{category.nameEn} / {category.nameZh}</span>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div id={`category-panel-${category.id}`} className="p-3 border-t border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {category.terms.map((term) => {
              const isSelected = selectedTerms.has(term.id);
              return (
                <button
                  key={term.id}
                  onClick={() => onToggleTerm(term)}
                  title={`${term.termEn} / ${term.termZh}`}
                  aria-pressed={isSelected}
                  className={`relative p-2 text-xs rounded-md border transition-colors duration-150 ease-in-out flex items-center justify-center text-center
                              ${isSelected 
                                ? 'bg-gray-200 text-gray-800 border-gray-400 ring-1 ring-gray-500' 
                                : `bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400 ${term.isCustom ? 'border-dashed border-purple-400' : ''}`
                              }`}
                >
                  {isSelected && <CheckCircleIcon className="w-3 h-3 text-black absolute top-1 right-1" />}
                  <span className="truncate leading-tight">
                    {term.termEn}
                    {term.isCustom && <span className="block text-[9px] text-purple-600">(Custom)</span>}
                    <br/>
                    <span className="text-gray-500 text-[10px]">
                        {term.termZh}
                        {term.isCustom && <span className="block text-[9px] text-purple-600">(自訂)</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => onShowAddCustomTermModal(category.id, `${category.nameEn} / ${category.nameZh}`)}
              className="w-full flex items-center justify-center px-3 py-1.5 border-2 border-dashed border-gray-300 text-xs font-medium rounded-md text-gray-500 hover:text-black hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors"
            >
              <PlusCircleIcon className="w-4 h-4 mr-1.5" />
              新增自訂詞語到此分類
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
