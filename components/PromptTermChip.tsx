
import React from 'react';
import { SelectedPromptTerm } from '../types';
import { LockClosedIcon, LockOpenIcon, MinusCircleIcon, PlusCircleIcon, XCircleIcon } from './Icons';
import { IconButton } from './IconButton';

interface PromptTermChipProps {
  term: SelectedPromptTerm;
  onUpdateWeight: (termId: string, delta: number) => void;
  onToggleLock: (termId: string) => void;
  onRemove: (termId: string) => void;
}

export const PromptTermChip: React.FC<PromptTermChipProps> = ({ term, onUpdateWeight, onToggleLock, onRemove }) => {
  return (
    <div 
        className={`flex items-center space-x-1.5 p-2 rounded-lg text-xs
                    ${term.locked ? 'bg-gray-200 border border-gray-400' : 'bg-gray-100 border border-gray-300'}
                    shadow-sm`}
        title={`${term.termEn} / ${term.termZh} (權重: ${term.weight.toFixed(1)})${term.locked ? ' - 已鎖定' : '' }`}
    >
      <span className="font-medium text-gray-700 flex-grow truncate">
        {term.termEn} ({term.weight.toFixed(1)})
        <span className="block text-gray-500 text-[10px] truncate">{term.termZh}</span>
      </span>
      
      <div className="flex items-center space-x-0.5">
        <IconButton
            onClick={() => onUpdateWeight(term.id, -0.1)}
            aria-label={`減少 ${term.termEn} 權重`}
            title="減少權重"
            className="text-gray-500 hover:text-gray-700"
            disabled={term.locked}
        >
            <MinusCircleIcon className="w-4 h-4" />
        </IconButton>
        <IconButton
            onClick={() => onUpdateWeight(term.id, 0.1)}
            aria-label={`增加 ${term.termEn} 權重`}
            title="增加權重"
            className="text-gray-500 hover:text-gray-700"
            disabled={term.locked}
        >
            <PlusCircleIcon className="w-4 h-4" />
        </IconButton>
        <IconButton
            onClick={() => onToggleLock(term.id)}
            aria-label={term.locked ? `解鎖 ${term.termEn}` : `鎖定 ${term.termEn}`}
            title={term.locked ? "解鎖提示詞" : "鎖定提示詞"}
            className={`${term.locked ? 'text-black' : 'text-gray-500 hover:text-black'}`}
        >
            {term.locked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
        </IconButton>
         {!term.locked && (
            <IconButton
                onClick={() => onRemove(term.id)}
                aria-label={`移除 ${term.termEn}`}
                title="移除提示詞"
                className="text-gray-400 hover:text-gray-700"
            >
                <XCircleIcon className="w-4 h-4" />
            </IconButton>
        )}
      </div>
    </div>
  );
};
