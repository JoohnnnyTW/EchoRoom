
import React from 'react';
import { SelectedPromptTerm, PromptTermChipProps as ChipProps, SelectedPromptTermForChip } from '../types'; 
import { LockClosedIcon, LockOpenIcon, MinusCircleIcon, PlusCircleIcon, XCircleIcon, ArrowRightCircleIcon } from './Icons';
import { IconButton } from './IconButton';

// Ensure props interface matches the one defined in types.ts
interface PromptTermChipProps extends ChipProps {}


export const PromptTermChip: React.FC<PromptTermChipProps> = ({ term, onUpdateWeight, onToggleLock, onRemove, onSaveTerm, onCopyToQuickAdd, uiTexts }) => {
  return (
    <div 
        className={`flex items-center space-x-1.5 p-2 rounded-lg text-xs
                    ${term.locked ? 'bg-gray-200 border border-gray-400' : 'bg-gray-100 border border-gray-300'}
                    shadow-sm`}
        title={`${term.termEn} / ${term.termZh} (權重: ${term.weight.toFixed(1)})${term.locked ? ' - 已鎖定' : '' }${term.isCustom ? ' (add)' : ''}`}
    >
      <span className="font-medium text-gray-900/90 flex-grow truncate">
        {term.termEn} ({term.weight.toFixed(1)})
        <span className="block text-gray-600 text-[10px] truncate">{term.termZh}</span>
        {term.isCustom && <span className="block text-gray-600 text-[9px]">add</span>}
      </span>
      
      <div className="flex items-center space-x-0.5">
        {onCopyToQuickAdd && (
            <IconButton
                onClick={() => onCopyToQuickAdd(term.termEn, term.termZh)}
                aria-label={`複製 ${term.termEn} 到快速新增欄位`}
                title={uiTexts.chipCopyToQuickAddButtonTitle}
                className="text-gray-600 hover:text-gray-800 active:scale-95 transform transition-transform duration-100"
            >
                <ArrowRightCircleIcon className="w-4 h-4" />
            </IconButton>
        )}
        {!term.isCustom && !term.isCategorized && onSaveTerm && (
            <button
                onClick={() => onSaveTerm(term)}
                title={uiTexts.saveTermToCategoryButtonTitle}
                aria-label={`儲存 ${term.termEn} 到分類`}
                className="px-1.5 py-0.5 text-[10px] rounded border border-gray-400 bg-white text-gray-800 hover:bg-gray-100 hover:border-gray-500 transition-colors active:scale-95 transform duration-100"
            >
                {uiTexts.chipSaveTermButtonLabel}
            </button>
        )}
        <IconButton
            onClick={() => onUpdateWeight(term.id, -0.1)}
            aria-label={`減少 ${term.termEn} 權重`}
            title="減少權重"
            className="text-gray-600 hover:text-gray-800 active:scale-95 transform transition-transform duration-100"
            disabled={term.locked}
        >
            <MinusCircleIcon className="w-4 h-4" />
        </IconButton>
        <IconButton
            onClick={() => onUpdateWeight(term.id, 0.1)}
            aria-label={`增加 ${term.termEn} 權重`}
            title="增加權重"
            className="text-gray-600 hover:text-gray-800 active:scale-95 transform transition-transform duration-100"
            disabled={term.locked}
        >
            <PlusCircleIcon className="w-4 h-4" />
        </IconButton>
        <IconButton
            onClick={() => onToggleLock(term.id)}
            aria-label={term.locked ? `解鎖 ${term.termEn}` : `鎖定 ${term.termEn}`}
            title={term.locked ? "解鎖提示詞" : "鎖定提示詞"}
            className={`${term.locked ? 'text-black' : 'text-gray-600 hover:text-black'} active:scale-95 transform transition-transform duration-100`}
        >
            {term.locked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
        </IconButton>
         {!term.locked && (
            <IconButton
                onClick={() => onRemove(term.id)}
                aria-label={`移除 ${term.termEn}`}
                title="移除提示詞"
                className="text-gray-500 hover:text-gray-700 active:scale-95 transform transition-transform duration-100"
            >
                <XCircleIcon className="w-4 h-4" />
            </IconButton>
        )}
      </div>
    </div>
  );
};
