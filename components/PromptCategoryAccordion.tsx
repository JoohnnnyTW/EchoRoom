
import React from 'react';
import { PromptCategoryDisplay, PromptTerm, SelectedPromptTerm, PromptCategoryAccordionProps as ComponentProps } from '../types'; 
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, PlusCircleIcon, TrashIcon } from './Icons'; 
import { IconButton } from './IconButton'; 

interface PromptCategoryAccordionProps extends ComponentProps {} // For clarity if props were more complex

export const PromptCategoryAccordion: React.FC<PromptCategoryAccordionProps> = ({ 
  category, 
  selectedTerms, 
  onToggleTerm,
  isOpen,
  onToggle,
  onShowAddCustomTermModal,
  onDeleteTerm, 
  onDeleteCategory, // New prop for deleting the whole category
}) => {

  const handleDeleteSingleTerm = (term: PromptTerm, event: React.MouseEvent) => {
    event.stopPropagation(); 
    
    let confirmMessage = `您確定要從「${category.nameZh}」分類中刪除詞語「${term.termZh} (${term.termEn})」嗎？`;
    confirmMessage += `\n此操作會將其從目前設定中移除。`;
    if (!term.isCustom) {
        confirmMessage += `\n(此為預設詞語，若要復原，需重設此分類或整體應用程式設定至預設值。)`;
    } else {
        confirmMessage += `\n(此為自訂詞語，刪除後無法輕易復原。)`;
    }

    if (window.confirm(confirmMessage)) {
      onDeleteTerm(term.id, category.id);
    }
  };

  const handleDeleteFullCategory = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDeleteCategory) {
        const confirmMessage = `您確定要刪除分類「${category.nameZh} (${category.nameEn})」及其包含的所有詞語嗎？\n此操作無法復原。`;
        if (window.confirm(confirmMessage)) {
            onDeleteCategory(category.id);
        }
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden mb-3">
      <div className="flex items-center justify-between p-3 text-left text-sm font-medium text-gray-900/90 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
        <button
          onClick={onToggle}
          className="flex-grow flex items-center text-left active:scale-95 transform transition-transform duration-100"
          aria-expanded={isOpen}
          aria-controls={`category-panel-${category.id}`}
        >
          <span className="flex-grow">{category.nameEn} / {category.nameZh}</span>
        </button>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {onDeleteCategory && (
            <IconButton
              onClick={handleDeleteFullCategory}
              aria-label={`刪除分類 ${category.nameZh}`}
              title={`刪除分類 "${category.nameZh}"`}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 active:scale-95 transform transition-transform duration-100"
            >
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          )}
          <IconButton onClick={onToggle} aria-label={isOpen ? "收合分類" : "展開分類"} className="active:scale-95 transform transition-transform duration-100">
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
          </IconButton>
        </div>
      </div>
      {isOpen && (
        <div id={`category-panel-${category.id}`} className="p-3 border-t border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2"> {}
            {category.terms.map((term) => {
              const isSelected = selectedTerms.has(term.id);
              return (
                <div key={term.id} className="relative group">
                  <button
                    onClick={() => onToggleTerm(term, category.id)}
                    title={`${term.termEn} / ${term.termZh}`}
                    aria-pressed={isSelected}
                    className={`w-full h-full p-2 text-xs rounded-md border transition-colors duration-150 ease-in-out flex items-center justify-center text-center active:scale-95 transform
                                ${isSelected 
                                  ? 'bg-gray-200 text-gray-800 border-gray-400 ring-1 ring-gray-500' 
                                  : `bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400 ${term.isCustom ? 'border-dashed border-purple-400' : ''}`
                                }`}
                  >
                    {isSelected && <CheckCircleIcon className="w-3 h-3 text-black absolute top-1 right-1 z-10" />}
                    <span className="truncate leading-tight">
                      <span className={isSelected ? 'text-gray-800' : 'text-gray-900/90'}>{term.termEn}</span>
                      {term.isCustom && <span className="block text-[9px] text-gray-600">add</span>}
                      <br/>
                      <span className="text-gray-600 text-[10px]">
                          {term.termZh}
                          {term.isCustom && <span className="block text-[9px] text-gray-600">add</span>}
                      </span>
                    </span>
                  </button>
                  <IconButton
                      onClick={(e) => handleDeleteSingleTerm(term, e)}
                      aria-label={`刪除詞語 ${term.termZh}`}
                      title={`刪除詞語 "${term.termZh}"`}
                      className="absolute top-0.5 left-0.5 p-0.5 bg-white bg-opacity-50 hover:bg-opacity-100 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 active:scale-95 transform"
                  >
                      <TrashIcon className="w-3 h-3" />
                  </IconButton>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => onShowAddCustomTermModal(category.id, `${category.nameEn} / ${category.nameZh}`)}
              className="w-full flex items-center justify-center px-3 py-1.5 border-2 border-dashed border-gray-300 text-xs font-medium rounded-md text-gray-800 hover:text-black hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors active:scale-95 transform duration-100"
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
