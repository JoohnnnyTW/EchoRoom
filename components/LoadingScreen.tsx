
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlaceholdersAndVanishInput } from './PlaceholdersAndVanishInput';
import { SparklesIcon, CheckCircleIcon, InformationCircleIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { motion } from 'framer-motion';
import { AISetupProgressCallback, LoadingScreenProps } from '../types';
import { PulsatingRippleBackground } from './PulsatingRippleBackground'; 

const THEME_PLACEHOLDERS = [
  "您的應用程式產業主題是？ 例如：科幻遊戲美術設定...",
  "或輸入：專業攝影棚商品展示圖...",
  "也可以是：兒童教育繪本動物插畫風格...",
  "例如：奢華五星級酒店室內設計...",
  "或輸入：餐飲品牌菜單與廣告圖像...",
  "您的創意，從這裡開始定義...",
];

const INITIAL_COUNTDOWN_SECONDS = 250;

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onLoadingComplete,
  onInitiateAISetup 
}) => {
  const [themeInput, setThemeInput] = useState('');
  const [isSubmittingTheme, setIsSubmittingTheme] = useState(false);
  const [thinkingMessages, setThinkingMessages] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1); 
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isErrorState, setIsErrorState] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [setupFinishedInternal, setSetupFinishedInternal] = useState(false);

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const aiDerivedThemeEnRef = useRef<string>("Interior Design");
  const aiDerivedThemeZhRef = useRef<string>("室內設計");

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThemeInput(e.target.value);
  };

  const reportProgressCallback: AISetupProgressCallback = useCallback((
    messages, currentStep, total, isError = false, errorMsg
  ) => {
    setThinkingMessages(messages);
    setCurrentStepIndex(currentStep);
    setTotalSteps(total > 0 ? total : 1); 
    setCurrentProgress(total > 0 ? (currentStep / total) * 100 : 0);
    if (isError) {
      setIsErrorState(true);
      setErrorMessage(errorMsg || "發生未知錯誤。");
      setSetupFinishedInternal(true); 
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setCountdownSeconds(0); 
    }
    if (currentStep >= total && !isError) { 
        setSetupFinishedInternal(true);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, []);

  const handleThemeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (themeInput.trim() && !isSubmittingTheme) {
      setIsSubmittingTheme(true);
      setIsErrorState(false);
      setErrorMessage(null);
      setSetupFinishedInternal(false);
      setCountdownSeconds(INITIAL_COUNTDOWN_SECONDS);
      const result = await onInitiateAISetup(themeInput.trim(), reportProgressCallback);
      if (result) {
        aiDerivedThemeEnRef.current = result.themeEn;
        aiDerivedThemeZhRef.current = result.themeZh;
      } else { 
        aiDerivedThemeEnRef.current = "Interior Design"; 
        aiDerivedThemeZhRef.current = "室內設計";      
      }
    }
  };
  
  useEffect(() => {
    if (isSubmittingTheme && !setupFinishedInternal && countdownSeconds !== null && countdownSeconds > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isSubmittingTheme, setupFinishedInternal, countdownSeconds]);

  useEffect(() => {
    if (countdownSeconds === 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
    }
  }, [countdownSeconds]);


  useEffect(() => {
    if (setupFinishedInternal) {
      setCurrentProgress(100); 
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); 
      if (thinkingMessages.length > 0 && !isErrorState) {
          setCurrentStepIndex(thinkingMessages.length); 
      }
      const timer = setTimeout(() => {
        onLoadingComplete(aiDerivedThemeEnRef.current, aiDerivedThemeZhRef.current); 
      }, isErrorState ? 3500 : 1500); 
      return () => clearTimeout(timer);
    }
  }, [setupFinishedInternal, onLoadingComplete, isErrorState, thinkingMessages.length]);

  const handleSkipAISetupAndUseDefaults = () => {
    aiDerivedThemeEnRef.current = "Interior Design";
    aiDerivedThemeZhRef.current = "室內設計";
    setIsSubmittingTheme(false); 
    setSetupFinishedInternal(true); 
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdownSeconds(null);
  };
  
  const handleSkipAISetupDuringSubmission = () => {
    if (isSubmittingTheme && !setupFinishedInternal) {
        onLoadingComplete("Interior Design", "室內設計"); 
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdownSeconds(null);
    }
  };

  const tooltipText = "輸入主題後等待約250秒，系統將自動進入您設計的專用詞庫。若進入後未見任何變更，請重新整理頁面並再次嘗試操作。";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-4 relative isolate">
      <PulsatingRippleBackground /> 
      {/* @ts-ignore TODO: Investigate framer-motion type definition issue for initial, animate, transition props. */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 z-10" 
      >
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">
          Welcome to EchoRoom Creative
        </h1>
        {!isSubmittingTheme && (
            <p className="text-sm text-gray-700 mt-2 max-w-lg mx-auto">
                EchoRoom改變您AI生圖創作方式，為您設計專用詞庫
            </p>
        )}
      </motion.div>

      {!isSubmittingTheme && (
        // @ts-ignore TODO: Investigate framer-motion type definition issue for initial, animate, transition props.
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-lg space-y-4 z-10"
        >
          <div className="relative flex items-center w-full">
            <PlaceholdersAndVanishInput
              placeholders={THEME_PLACEHOLDERS}
              onChange={handleThemeChange}
              onSubmit={handleThemeSubmit}
            />
            <div className="group relative ml-2 flex-shrink-0">
              <InformationCircleIcon className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-help" />
              <div 
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3
                           bg-gray-800 text-white text-xs rounded-md shadow-lg 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           pointer-events-none z-50"
                role="tooltip"
              >
                {tooltipText}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-px w-0 h-0
                                border-x-4 border-x-transparent
                                border-t-4 border-t-gray-800"></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isSubmittingTheme && (
        // @ts-ignore TODO: Investigate framer-motion type definition issue for initial, animate, exit, transition props.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg mt-6 text-center flex flex-col items-center z-10"
        >
          <h2 className="text-xl font-medium mb-3 text-gray-800">
            正在為「{themeInput.trim() || "室內設計"}」主題進行 AI 設定調整...
          </h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden shadow-inner">
            {/* @ts-ignore TODO: Investigate framer-motion type definition issue for initial, animate, transition props. */}
            <motion.div
              className={`h-2.5 rounded-full ${isErrorState ? 'bg-red-500' : 'bg-black'}`}
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>
          
          <div className="text-xs text-gray-600 mb-2 h-4">
            {currentProgress < 100 && !isErrorState && `進度: ${Math.round(currentProgress)}%`}
          </div>

          {countdownSeconds !== null && countdownSeconds > 0 && !setupFinishedInternal && !isErrorState && (
            <div className="text-sm text-gray-700 my-2 font-medium">
              預計剩餘時間：<span className="text-black">{countdownSeconds}</span> 秒
            </div>
          )}
          {countdownSeconds === 0 && !setupFinishedInternal && !isErrorState && (
            <div className="text-sm text-orange-600 my-2 font-medium">
              AI 設定仍在進行中，請耐心等候...
            </div>
          )}


          {isErrorState && errorMessage && (
            <div className="my-2 p-2 w-full bg-red-100 border border-red-300 rounded-md text-sm text-red-700 font-medium text-left">
              <p><strong>錯誤：</strong>{errorMessage}</p>
            </div>
          )}

          <div className="mt-1 text-left w-full max-w-sm mx-auto space-y-1.5 text-xs min-h-[100px]">
            {thinkingMessages.map((message, index) => (
              <div key={index} className={`flex items-center transition-opacity duration-300 
                ${isErrorState && index >= currentStepIndex ? 'opacity-50' : (index <= currentStepIndex ? 'opacity-100' : 'opacity-50')}`}>
                
                {isErrorState && index === currentStepIndex ? (
                     <SparklesIcon className="w-3.5 h-3.5 mr-2 text-red-500 flex-shrink-0 animate-ping" />
                ) : index < currentStepIndex || (setupFinishedInternal && !isErrorState && index < thinkingMessages.length) ? (
                     <CheckCircleIcon className="w-3.5 h-3.5 mr-2 text-green-500 flex-shrink-0" />
                ) : index === currentStepIndex && !setupFinishedInternal ? (
                     <LoadingSpinner className="w-3 h-3 mr-2 text-black flex-shrink-0" />
                ) : (
                     <div className="w-3.5 h-3.5 mr-2 flex-shrink-0 border-2 border-gray-400 rounded-full" />
                )}

                <span className={`${index === currentStepIndex && !isErrorState && !setupFinishedInternal ? 'font-semibold text-black' : (isErrorState && index === currentStepIndex ? 'font-semibold text-red-600' : 'text-gray-700')}`}>
                  {message}
                </span>
              </div>
            ))}
          </div>
            {!isErrorState && setupFinishedInternal && (
               <p className="mt-3 text-sm text-green-600 font-semibold">AI 設定調整完成！即將進入工作室...</p>
            )}

        </motion.div>
      )}
       <footer className="absolute bottom-6 text-center text-xs text-gray-600 w-full px-4 z-10">
        {!isSubmittingTheme && (
            <button
            onClick={handleSkipAISetupAndUseDefaults}
            className="block mx-auto mb-2 text-gray-500 hover:text-gray-800 underline focus:outline-none"
            aria-label="直接進入工作室並使用通用設定"
            >
            直接進入工作室 (預設)
            </button>
        )}
        {isSubmittingTheme && !setupFinishedInternal && (
            <button
                onClick={handleSkipAISetupDuringSubmission}
                className="block mx-auto mb-2 text-gray-500 hover:text-gray-800 underline focus:outline-none"
                aria-label="略過AI設定並使用預設值"
            >
                略過並使用預設設定 (預設)
            </button>
        )}
        <div className="block">EchoRoom - AI 創意工作室</div>
      </footer>
    </div>
  );
};
