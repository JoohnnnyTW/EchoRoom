
import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, LightBulbIcon, TagIcon, HomeIcon } from './Icons';
import { AppSettings, UITexts } from '../types';
import { SettingsContext } from '../contexts/SettingsContext';
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts';

interface ConfirmationTutorialPageProps {
  theme: string; // This is the initial theme input by user, might be less relevant now
  onConfirm: () => void;
  uiTexts: UITexts; 
  appSettings: AppSettings; 
}

interface TutorialStep {
  id: string;
  title: (appSettings: AppSettings) => string; // Changed to only take appSettings
  content: (appSettings: AppSettings) => React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  image?: string; 
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: (appSettings) => `您的「${appSettings.appContextThemeZh || appSettings.appContextThemeEn || '通用'}」創意工作室已準備就緒！`,
    icon: SparklesIcon,
    content: (appSettings) => (
      <p className="text-sm md:text-base text-slate-600">
        我們已根據您的主題「<strong>{appSettings.appContextThemeZh || appSettings.appContextThemeEn || '通用'}</strong>」為 EchoRoom 進行了初步智慧設定。接下來的幾頁將向您展示部分已為您量身打造的內容。
      </p>
    ),
  },
  {
    id: 'designStyles',
    title: (appSettings) => `為「${appSettings.appContextThemeZh || appSettings.appContextThemeEn || '通用'}」主題調適的${appSettings.uiTexts?.styleSelectorTitle?.textZh || '設計風格'}`,
    icon: LightBulbIcon,
    content: (appSettings) => (
      <div className="text-xs md:text-sm text-slate-600 space-y-2 text-left max-h-60 overflow-y-auto apple-scroll p-2 bg-slate-100 rounded-md">
        <p className="mb-2">AI 已為您調整了設計風格的名稱與基礎提示詞，使其更貼近您的主題。例如：</p>
        {(appSettings.designStyles || []).slice(0, 2).map((style) => ( // Show 2 examples
          <div key={style.id} className="p-2 border border-slate-200 rounded bg-white">
            <p className="font-semibold text-slate-700">{style.nameZh} ({style.nameEn})</p>
            <p className="text-slate-500 text-[10px] md:text-xs whitespace-pre-wrap break-words" title={style.basePromptZh}>基礎提示詞 (中): {style.basePromptZh}</p>
            <p className="text-slate-500 text-[10px] md:text-xs whitespace-pre-wrap break-words" title={style.basePromptEn}>Base Prompt (En): {style.basePromptEn}</p>
          </div>
        ))}
        {(!appSettings.designStyles || appSettings.designStyles.length === 0) && <p>尚無設計風格設定。</p>}
      </div>
    ),
  },
  {
    id: 'promptCategories',
    title: (appSettings) => `主題化的「${appSettings.uiTexts?.promptCategoriesMainTitle?.textZh || '提示詞分類'}」與範例詞語`,
    icon: TagIcon,
    content: (appSettings) => (
      <div className="text-xs md:text-sm text-slate-600 space-y-2 text-left max-h-60 overflow-y-auto apple-scroll p-2 bg-slate-100 rounded-md">
        <p className="mb-2">提示詞分類的名稱與其中的詞語也已根據您的主題進行了初步客製化。例如：</p>
        {Object.values(appSettings.customPromptCategorySettings || {}).slice(0, 1).map((category) => ( // Show 1 category
          <div key={category.id} className="p-2 border border-slate-200 rounded bg-white">
            <p className="font-semibold text-slate-700">{category.nameZh} ({category.nameEn})</p>
            <div className="pl-2 mt-1 space-y-0.5">
              {(category.terms || []).slice(0, 2).map(term => ( // Show 2 terms from that category
                <p key={term.id} className="text-slate-500 text-[10px] md:text-xs">
                  - {term.termZh} ({term.termEn})
                </p>
              ))}
              {(!category.terms || category.terms.length === 0) && <p className="text-slate-400 text-[10px] md:text-xs">- 此分類尚無詞語</p>}
            </div>
          </div>
        ))}
        {(!appSettings.customPromptCategorySettings || Object.keys(appSettings.customPromptCategorySettings).length === 0) && <p>尚無提示詞分類設定。</p>}
      </div>
    ),
  },
  {
    id: 'roomTypes',
    title: (appSettings) => {
      const roomTypeUITitle = appSettings.uiTexts?.roomTypeSelectorTitle?.textZh || "空間類型";
      return `情境化的「${roomTypeUITitle}」提示詞`;
    },
    icon: HomeIcon,
    content: (appSettings) => (
        <div className="text-xs md:text-sm text-slate-600 space-y-2 text-left max-h-60 overflow-y-auto apple-scroll p-2 bg-slate-100 rounded-md">
        <p className="mb-2">「{appSettings.uiTexts?.roomTypeSelectorTitle?.textZh || '空間類型'}」的提示詞也已適應您的「<strong>{appSettings.appContextThemeZh || appSettings.appContextThemeEn || '通用'}</strong>」主題。以下是一些範例：</p>
        {(appSettings.roomTypes || []).slice(0, 3).map((roomType) => ( // Show 3 examples
          <div key={roomType.id} className="p-1.5 border border-slate-200 rounded bg-white">
            <p className="font-medium text-slate-700 text-[11px] md:text-xs">{roomType.termZh} ({roomType.termEn})</p>
          </div>
        ))}
        {(!appSettings.roomTypes || appSettings.roomTypes.length === 0) && <p>尚無空間類型設定。</p>}
      </div>
    )
  },
  {
    id: 'getStarted',
    title: () => '一切就緒，開始您的創作之旅！',
    icon: CheckCircleIcon,
    content: () => (
      <p className="text-sm md:text-base text-slate-600">
        您隨時可以在「設定」選單中進一步檢視和自訂這些項目。祝您創作愉快！
      </p>
    ),
  },
];


export const ConfirmationTutorialPage: React.FC<ConfirmationTutorialPageProps> = ({
  theme, // This prop might become less important as appSettings now holds the AI-derived theme
  onConfirm,
  uiTexts: propUITexts,
  appSettings,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  // No need to use SettingsContext here if appSettings is passed directly and reliably updated
  const uiTextsForButton = propUITexts || appSettings.uiTexts || DEFAULT_UI_TEXTS;


  const currentStep = TUTORIAL_STEPS[currentPageIndex];
  const IconComponent = currentStep.icon;

  const handleNext = () => {
    if (currentPageIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      onConfirm();
    }
  };

  const handleBack = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-slate-800 p-4 md:p-6 overflow-hidden">
      {/* @ts-ignore TODO: Investigate framer-motion type definition issue for initial, animate, exit, transition props. */}
      <motion.div
        key={currentPageIndex} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full max-w-xl bg-white rounded-xl p-6 md:p-8 text-center"
      >
        {IconComponent && <IconComponent className="w-12 h-12 md:w-14 md:h-14 text-black mx-auto mb-4" />}
        
        <h1 className="text-xl md:text-2xl font-bold mb-4 font-heading-custom">
          {currentStep.title(appSettings)}
        </h1>

        <div className="min-h-[120px] md:min-h-[150px] mb-6">
          {currentStep.content(appSettings)}
        </div>

        {currentStep.image && (
             <img
                className="h-48 md:h-64 w-full max-w-md mx-auto flex-none rounded-lg object-cover mb-6 shadow-lg"
                src={currentStep.image}
                alt={`Tutorial step ${currentPageIndex + 1}`}
            />
        )}

        <div className="flex items-center justify-center gap-3 md:gap-4 mt-6">
          {currentPageIndex > 0 && (
            <button
              onClick={handleBack}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              aria-label="上一頁"
            >
              上一頁
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 transition-colors"
            aria-label={currentPageIndex === TUTORIAL_STEPS.length - 1 ? "開始使用" : "下一頁"}
          >
            {currentPageIndex === TUTORIAL_STEPS.length - 1 ? '開始使用 EchoRoom' : '下一頁'}
          </button>
        </div>

        <div className="flex justify-center items-center mt-8 space-x-1.5">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentPageIndex ? 'bg-black' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </motion.div>
      <p className="text-xs text-slate-400 mt-6 font-body">
         EchoRoom Creative - AI 驅動的創意工作室
      </p>
    </div>
  );
};

export default ConfirmationTutorialPage;
