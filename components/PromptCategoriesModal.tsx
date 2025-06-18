
import React from 'react';
import { PromptCategoryDisplay, SelectedPromptTerm, PromptTerm } from '../types';
import { PromptCategoryAccordion } from './PromptCategoryAccordion';
import { IconButton } from './IconButton';
import { LoadingSpinner } from './LoadingSpinner';
import { XCircleIcon, ChevronDownIcon, ChevronUpIcon, CubeTransparentIcon, PlusCircleIcon as PlusCircleIconForAdd } from './Icons'; // Ensure PlusCircleIconForAdd is aliased if PlusCircleIcon is also used with a different meaning

interface PromptCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiTexts: {
    promptCategoriesMainTitle: { textZh: string };
  };
  relevantCategories: PromptCategoryDisplay[];
  activePromptTerms: Map<string, SelectedPromptTerm>;
  toggleTerm: (term: PromptTerm, categoryId: string) => void;
  getAccordionOpenState: (categoryId: string) => boolean;
  handleToggleAccordion: (categoryId: string) => void;
  handleExpandAllAccordions: () => void;
  handleCollapseAllAccordions: () => void;
  toggleAddCategoryModal: () => void;
  handleRandomizeAllPrompts: () => void;
  isLoadingRandomPrompts: boolean;
  randomPromptsError: string | null;
  isPromptCategoriesEnabled: boolean;
  setIsPromptCategoriesEnabled: (enabled: boolean) => void;
  geminiApiKeySet: boolean;
  selectedStyle: any; // Simplified for now, pass proper type if needed for randomize button logic
  isRoomTypeSelectorEnabled: boolean; // Added for randomize button logic
  selectedRoomType: PromptTerm | null; // Added for randomize button logic
  handleOpenAddCustomTermFromCategoryModal: (categoryId: string, categoryName: string) => void;
  handleDeleteTermFromCategoryAndActive: (termId: string, categoryId: string) => void;
  handleDeletePromptCategoryAndUpdateActive: (categoryId: string) => void;
}

export const PromptCategoriesModal: React.FC<PromptCategoriesModalProps> = ({
  isOpen,
  onClose,
  uiTexts,
  relevantCategories,
  activePromptTerms,
  toggleTerm,
  getAccordionOpenState,
  handleToggleAccordion,
  handleExpandAllAccordions,
  handleCollapseAllAccordions,
  toggleAddCategoryModal,
  handleRandomizeAllPrompts,
  isLoadingRandomPrompts,
  randomPromptsError,
  isPromptCategoriesEnabled,
  setIsPromptCategoriesEnabled,
  geminiApiKeySet,
  selectedStyle,
  isRoomTypeSelectorEnabled,
  selectedRoomType,
  handleOpenAddCustomTermFromCategoryModal,
  handleDeleteTermFromCategoryAndActive,
  handleDeletePromptCategoryAndUpdateActive,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[60] transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-categories-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-4 md:p-6 w-full max-w-3xl max-h-[85vh] flex flex-col transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 id="prompt-categories-modal-title" className="text-lg md:text-xl font-semibold text-gray-900/90">
            {uiTexts.promptCategoriesMainTitle.textZh}
          </h2>
          <IconButton onClick={onClose} aria-label="關閉提示詞分類" className="text-gray-500 hover:text-gray-700">
            <XCircleIcon className="w-7 h-7" />
          </IconButton>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-start gap-2 text-xs">
            <button onClick={toggleAddCategoryModal} className="px-2 py-1 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-100 flex items-center active:scale-95 transform transition-transform duration-100"><PlusCircleIconForAdd className="w-3.5 h-3.5 mr-1"/>新增分類</button>
            <IconButton onClick={handleExpandAllAccordions} title="全部展開" aria-label="展開所有分類"><ChevronDownIcon className="w-4 h-4"/></IconButton>
            <IconButton onClick={handleCollapseAllAccordions} title="全部收合" aria-label="收合所有分類"><ChevronUpIcon className="w-4 h-4"/></IconButton>
            <button
                onClick={handleRandomizeAllPrompts}
                disabled={isLoadingRandomPrompts || !geminiApiKeySet || !selectedStyle || (isRoomTypeSelectorEnabled && !selectedRoomType)}
                className="px-2 py-1 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-100 disabled:opacity-50 flex items-center active:scale-95 transform transition-transform duration-100"
                title={!geminiApiKeySet ? "Gemini API 金鑰未設定" : ((!selectedStyle || (isRoomTypeSelectorEnabled && !selectedRoomType)) ? "請先選擇風格和空間類型" : "AI 隨機選取提示詞")}
            >
                {isLoadingRandomPrompts ? <LoadingSpinner className="w-3.5 h-3.5 mr-1"/> : <CubeTransparentIcon className="w-4 h-4 mr-1"/>}
                AI 隨機選詞
            </button>
            <label htmlFor="togglePromptCategoriesModal" className="flex items-center cursor-pointer pl-2">
                <span className="mr-1.5 text-gray-700">啟用分類詞語:</span>
                <div className="relative">
                    <input type="checkbox" id="togglePromptCategoriesModal" className="sr-only" checked={isPromptCategoriesEnabled} onChange={(e) => setIsPromptCategoriesEnabled(e.target.checked)}/>
                    <div className={`block w-8 h-5 rounded-full transition-colors ${isPromptCategoriesEnabled ? 'bg-black' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isPromptCategoriesEnabled ? 'translate-x-full' : ''}`}></div>
                </div>
            </label>
        </div>
        {randomPromptsError && <p className="text-xs text-red-500 mb-2 p-1 bg-red-50 rounded-md">{randomPromptsError}</p>}

        <div className={`flex-grow overflow-y-auto apple-scroll pr-1 -mr-1 transition-opacity duration-300 ${isPromptCategoriesEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          {relevantCategories.map((category) => (
            <PromptCategoryAccordion
              key={category.id}
              category={category}
              selectedTerms={activePromptTerms}
              onToggleTerm={toggleTerm}
              isOpen={getAccordionOpenState(category.id)}
              onToggle={() => handleToggleAccordion(category.id)}
              onShowAddCustomTermModal={handleOpenAddCustomTermFromCategoryModal}
              onDeleteTerm={handleDeleteTermFromCategoryAndActive}
              onDeleteCategory={handleDeletePromptCategoryAndUpdateActive}
            />
          ))}
        </div>
         <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md bg-black text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                完成
            </button>
        </div>
      </div>
    </div>
  );
};
