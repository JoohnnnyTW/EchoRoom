
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppSettings, SettingsContextType, ImageGenerationSettings, AISystemPrompts, UITexts, CustomPromptCategorySettings, StoredAppSettings, PromptTerm, CustomPromptCategorySetting, DesignStyle, DynamicDetailSet, CachedProfile } from '../types';
import { DEFAULT_IMAGE_GENERATION_SETTINGS } from '../constants/imageGenerationOptions';
import { DEFAULT_AI_SYSTEM_PROMPTS } from '../constants/aiPrompts';
import { DEFAULT_UI_TEXTS } from '../constants/uiTexts';
import { DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS } from '../constants/customPromptCategorySettings';
import { DESIGN_STYLES as INITIAL_DESIGN_STYLES_CONST, ROOM_TYPES as INITIAL_ROOM_TYPES_CONST } from '../constants/designData';


const APP_SETTINGS_STORAGE_KEY = 'echoRoomAppSettings_v5';
const CACHED_PROFILES_STORAGE_KEY = 'echoRoomCachedProfiles_v1';
export const FACTORY_DEFAULT_PROFILE_ID = '__FACTORY_DEFAULT_PROFILE__';

const ensureThreeTerms = (terms?: string[]): string[] => {
    const currentTerms = Array.isArray(terms) ? terms.filter(t => typeof t === 'string') : [];
    const ensured = [...currentTerms.slice(0, 3)];
    while (ensured.length < 3) {
        ensured.push('');
    }
    return ensured;
};

export const initialAppSettings: AppSettings = { // Export for use in SettingsModal AI reset
  imageGeneration: JSON.parse(JSON.stringify(DEFAULT_IMAGE_GENERATION_SETTINGS)),
  aiSystemPrompts: JSON.parse(JSON.stringify(DEFAULT_AI_SYSTEM_PROMPTS)),
  uiTexts: JSON.parse(JSON.stringify(DEFAULT_UI_TEXTS)),
  customPromptCategorySettings: JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS)),
  designStyles: (Array.isArray(INITIAL_DESIGN_STYLES_CONST) ? JSON.parse(JSON.stringify(INITIAL_DESIGN_STYLES_CONST)) : []).map(style => ({
      ...style,
      descriptionEn: style.descriptionEn || '',
      descriptionZh: style.descriptionZh || '',
      dynamicDetails: style.dynamicDetails && style.dynamicDetails.length === 2
          ? [
              { ...style.dynamicDetails[0], termsEn: ensureThreeTerms(style.dynamicDetails[0].termsEn), termsZh: ensureThreeTerms(style.dynamicDetails[0].termsZh) },
              { ...style.dynamicDetails[1], termsEn: ensureThreeTerms(style.dynamicDetails[1].termsEn), termsZh: ensureThreeTerms(style.dynamicDetails[1].termsZh) }
            ]
          : [
              { labelEn: "Suggested Details 1", labelZh: "建議細節 1", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) },
              { labelEn: "Suggested Details 2", labelZh: "建議細節 2", termsEn: ensureThreeTerms([]), termsZh: ensureThreeTerms([]) }
            ] as [DynamicDetailSet, DynamicDetailSet]
  })),
  roomTypes: Array.isArray(INITIAL_ROOM_TYPES_CONST) ? JSON.parse(JSON.stringify(INITIAL_ROOM_TYPES_CONST)) : [],
  appContextThemeEn: 'Interior Design',
  appContextThemeZh: '室內設計',
};

export const deepMerge = <T extends object>(target: T, source: Partial<T>): T => {
  const output = { ...target };
  Object.keys(source).forEach(keyStr => {
    const key = keyStr as keyof T;
    const targetValue = output[key];
    const sourceValue = source[key];

    if (sourceValue === undefined) return;

    if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue) && !(sourceValue instanceof Function)) {
      if (typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue) && !(targetValue instanceof Function)) {
        output[key] = deepMerge(targetValue as object, sourceValue as Partial<object>) as T[keyof T];
      } else {
        output[key] = JSON.parse(JSON.stringify(sourceValue));
      }
    } else if (Array.isArray(sourceValue)) {
      const targetArray = Array.isArray(targetValue) ? targetValue as Array<any> : [];

      const isArrayOfIdentifiableObjects =
        sourceValue.length > 0 && sourceValue.every(item => typeof item === 'object' && item !== null && 'id' in item) &&
        (targetArray.length === 0 || targetArray.every(item => typeof item === 'object' && item !== null && 'id' in item));

      if (isArrayOfIdentifiableObjects) {
        const mergedArray: Array<{ id: string; [key: string]: any }> = [];
        const sourceMap = new Map(sourceValue.map(item => [item.id, item]));
        const processedTargetIds = new Set<string>();


        targetArray.forEach(targetItem => {
          const sourceItem = sourceMap.get(targetItem.id);
          if (sourceItem) {
            mergedArray.push(deepMerge(targetItem, sourceItem));
            sourceMap.delete(targetItem.id);
          } else {
            mergedArray.push(targetItem);
          }
          processedTargetIds.add(targetItem.id);
        });

        sourceValue.forEach(sourceItem => {
            if (!processedTargetIds.has(sourceItem.id)) {
                 mergedArray.push(JSON.parse(JSON.stringify(sourceItem)));
            }
        });

        output[key] = mergedArray as T[keyof T];
      } else {
        output[key] = JSON.parse(JSON.stringify(sourceValue));
      }
    } else {
      output[key] = sourceValue as T[keyof T];
    }
  });
  return output;
};


export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const storedSettingsJson = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      if (storedSettingsJson) {
        const storedSettings = JSON.parse(storedSettingsJson) as StoredAppSettings;

        let loadedSettings: AppSettings = JSON.parse(JSON.stringify(initialAppSettings));

        if (storedSettings.imageGeneration) {
          loadedSettings.imageGeneration = deepMerge(loadedSettings.imageGeneration, storedSettings.imageGeneration);
        }
        if (storedSettings.aiSystemPrompts) {
          loadedSettings.aiSystemPrompts = deepMerge(loadedSettings.aiSystemPrompts, storedSettings.aiSystemPrompts);
        }
        if (storedSettings.uiTexts) {
          loadedSettings.uiTexts = deepMerge(loadedSettings.uiTexts, storedSettings.uiTexts);
        }
        if (storedSettings.customPromptCategorySettings) {
          loadedSettings.customPromptCategorySettings = deepMerge(loadedSettings.customPromptCategorySettings, storedSettings.customPromptCategorySettings);
          for (const catId in loadedSettings.customPromptCategorySettings) {
            const category = loadedSettings.customPromptCategorySettings[catId];
            const defaultCatStructure = DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS[catId] ||
                                      { id: catId, nameEn: "Unknown", nameZh: "未知", terms: [], isOpenDefault: false };
            const validatedTerms = (Array.isArray(category.terms) ? category.terms : []).map((term: any) => ({
              id: term.id || `term_${Date.now()}_${Math.random()}`,
              termEn: term.termEn || "Unknown Term",
              termZh: term.termZh || "未知詞語",
              isCustom: term.isCustom !== undefined ? term.isCustom : true,
              categoryId: catId,
              ...term,
            }));
            loadedSettings.customPromptCategorySettings[catId] = {
                ...defaultCatStructure,
                ...category,
                id: catId,
                terms: validatedTerms,
            };
          }
        }
        if (storedSettings.designStyles) {
            const mergedStyles = deepMerge(
                { temp: Array.isArray(INITIAL_DESIGN_STYLES_CONST) ? INITIAL_DESIGN_STYLES_CONST : [] },
                { temp: storedSettings.designStyles }
            ).temp as DesignStyle[];

            loadedSettings.designStyles = mergedStyles.map(style => {
                const oldStyle = style as any;
                const dynamicDetailsExist = style.dynamicDetails && Array.isArray(style.dynamicDetails) && style.dynamicDetails.length === 2 &&
                                            style.dynamicDetails.every(dd => typeof dd === 'object' && dd !== null &&
                                                                        typeof dd.labelEn === 'string' && typeof dd.labelZh === 'string' &&
                                                                        Array.isArray(dd.termsEn) && Array.isArray(dd.termsZh));

                let detail1: DynamicDetailSet = { labelEn: "Suggested Details 1", labelZh: "建議細節 1", termsEn: [], termsZh: [] };
                let detail2: DynamicDetailSet = { labelEn: "Suggested Details 2", labelZh: "建議細節 2", termsEn: [], termsZh: [] };

                if (dynamicDetailsExist) {
                    detail1 = { ...style.dynamicDetails[0], termsEn: ensureThreeTerms(style.dynamicDetails[0].termsEn), termsZh: ensureThreeTerms(style.dynamicDetails[0].termsZh) };
                    detail2 = { ...style.dynamicDetails[1], termsEn: ensureThreeTerms(style.dynamicDetails[1].termsEn), termsZh: ensureThreeTerms(style.dynamicDetails[1].termsZh) };
                } else if (oldStyle.furnitureBrandsEn || oldStyle.furnitureBrandsZh || oldStyle.decorTipsEn || oldStyle.decorTipsZh) {
                    detail1 = {
                        labelEn: loadedSettings.uiTexts.styleEditorFurnitureBrandsLabel?.textEn || "Suggested Furniture/Brands",
                        labelZh: loadedSettings.uiTexts.styleEditorFurnitureBrandsLabel?.textZh || "建議家具/品牌",
                        termsEn: ensureThreeTerms(oldStyle.furnitureBrandsEn),
                        termsZh: ensureThreeTerms(oldStyle.furnitureBrandsZh)
                    };
                    detail2 = {
                        labelEn: loadedSettings.uiTexts.styleEditorDecorTipsLabel?.textEn || "Decor Tips",
                        labelZh: loadedSettings.uiTexts.styleEditorDecorTipsLabel?.textZh || "佈置技巧",
                        termsEn: ensureThreeTerms(oldStyle.decorTipsEn),
                        termsZh: ensureThreeTerms(oldStyle.decorTipsZh)
                    };
                }
                 const { furnitureBrandsEn, furnitureBrandsZh, decorTipsEn, decorTipsZh, ...restOfStyle } = oldStyle;

                return {
                    ...restOfStyle,
                    descriptionEn: style.descriptionEn || '',
                    descriptionZh: style.descriptionZh || '',
                    dynamicDetails: [detail1, detail2] as [DynamicDetailSet, DynamicDetailSet]
                };
            });
        }
        if (storedSettings.roomTypes) {
           loadedSettings.roomTypes = deepMerge(
                { temp: Array.isArray(INITIAL_ROOM_TYPES_CONST) ? INITIAL_ROOM_TYPES_CONST : [] },
                { temp: storedSettings.roomTypes }
            ).temp as PromptTerm[];
        }

        // Handle new appContextThemeEn and appContextThemeZh
        if (storedSettings.appContextThemeEn) {
          loadedSettings.appContextThemeEn = storedSettings.appContextThemeEn;
        } else if ((storedSettings as any).appContextTheme) { // Migration from old single theme
          loadedSettings.appContextThemeEn = (storedSettings as any).appContextTheme;
        } else {
          loadedSettings.appContextThemeEn = initialAppSettings.appContextThemeEn;
        }

        if (storedSettings.appContextThemeZh) {
          loadedSettings.appContextThemeZh = storedSettings.appContextThemeZh;
        } else if ((storedSettings as any).appContextTheme) { // Migration from old single theme
          loadedSettings.appContextThemeZh = (storedSettings as any).appContextTheme;
        } else {
          loadedSettings.appContextThemeZh = initialAppSettings.appContextThemeZh;
        }

        loadedSettings.designStyles = Array.isArray(loadedSettings.designStyles) ? loadedSettings.designStyles : [];
        loadedSettings.roomTypes = Array.isArray(loadedSettings.roomTypes) ? loadedSettings.roomTypes : [];

        return loadedSettings;
      }
    } catch (error) {
      console.error("Error loading settings from localStorage:", error);
    }
    return JSON.parse(JSON.stringify(initialAppSettings));
  });

  const [cachedProfiles, setCachedProfiles] = useState<CachedProfile[]>(() => {
    try {
      const storedProfilesJson = localStorage.getItem(CACHED_PROFILES_STORAGE_KEY);
      if (storedProfilesJson) {
        const profiles = JSON.parse(storedProfilesJson) as CachedProfile[];
        if (Array.isArray(profiles) && profiles.every(p => p && p.id && p.name && p.settings && p.createdAt)) {
          return profiles.filter(p => p.id !== FACTORY_DEFAULT_PROFILE_ID).sort((a,b) => b.createdAt - a.createdAt);
        }
      }
    } catch (error) {
      console.error("Error loading cached profiles from localStorage:", error);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CACHED_PROFILES_STORAGE_KEY, JSON.stringify(cachedProfiles.filter(p => p.id !== FACTORY_DEFAULT_PROFILE_ID)));
    } catch (error) {
      console.error("Error saving cached profiles to localStorage:", error);
    }
  }, [cachedProfiles]);


  useEffect(() => {
    setSettings(prevSettings => {
        let newSettingsState = { ...prevSettings };
        let changed = false;

        const mergedAISystemPrompts = { ...DEFAULT_AI_SYSTEM_PROMPTS };
        for (const key in DEFAULT_AI_SYSTEM_PROMPTS) {
            const defaultPrompt = DEFAULT_AI_SYSTEM_PROMPTS[key as keyof AISystemPrompts];
            const existingPrompt = prevSettings.aiSystemPrompts[key as keyof AISystemPrompts];
            if (existingPrompt && typeof existingPrompt.template === 'string') {
                mergedAISystemPrompts[key as keyof AISystemPrompts] = {
                    ...defaultPrompt,
                    template: existingPrompt.template,
                };
            }
        }
        if (JSON.stringify(mergedAISystemPrompts) !== JSON.stringify(prevSettings.aiSystemPrompts)) {
            newSettingsState.aiSystemPrompts = mergedAISystemPrompts;
            changed = true;
        }

        const mergedUITexts = { ...DEFAULT_UI_TEXTS };
        for (const key in DEFAULT_UI_TEXTS) {
            const defaultText = DEFAULT_UI_TEXTS[key as keyof UITexts];
            const existingText = prevSettings.uiTexts[key as keyof UITexts];
            if (existingText && typeof existingText.textEn === 'string' && typeof existingText.textZh === 'string') {
                mergedUITexts[key as keyof UITexts] = {
                    ...defaultText,
                    textEn: existingText.textEn,
                    textZh: existingText.textZh,
                };
            }
        }
        if (JSON.stringify(mergedUITexts) !== JSON.stringify(prevSettings.uiTexts)) {
            newSettingsState.uiTexts = mergedUITexts;
            changed = true;
        }

        if (Array.isArray(newSettingsState.designStyles)) {
            newSettingsState.designStyles = newSettingsState.designStyles.map(style => {
                const oldStyle = style as any;
                const isDynamicDetailsValid = style.dynamicDetails &&
                    Array.isArray(style.dynamicDetails) &&
                    style.dynamicDetails.length === 2 &&
                    style.dynamicDetails.every(dd =>
                        typeof dd === 'object' && dd !== null &&
                        typeof dd.labelEn === 'string' &&
                        typeof dd.labelZh === 'string' &&
                        Array.isArray(dd.termsEn) && dd.termsEn.length === 3 && dd.termsEn.every(term => typeof term === 'string') &&
                        Array.isArray(dd.termsZh) && dd.termsZh.length === 3 && dd.termsZh.every(term => typeof term === 'string')
                    );

                if (isDynamicDetailsValid) {
                     return {
                        ...style,
                        dynamicDetails: [
                            { ...style.dynamicDetails[0], termsEn: ensureThreeTerms(style.dynamicDetails[0].termsEn), termsZh: ensureThreeTerms(style.dynamicDetails[0].termsZh) },
                            { ...style.dynamicDetails[1], termsEn: ensureThreeTerms(style.dynamicDetails[1].termsEn), termsZh: ensureThreeTerms(style.dynamicDetails[1].termsZh) }
                        ] as [DynamicDetailSet, DynamicDetailSet]
                    };
                }

                changed = true;
                let detail1: DynamicDetailSet = {
                    labelEn: newSettingsState.uiTexts.styleEditorFurnitureBrandsLabel?.textEn || "Suggested Furniture/Brands",
                    labelZh: newSettingsState.uiTexts.styleEditorFurnitureBrandsLabel?.textZh || "建議家具/品牌",
                    termsEn: ensureThreeTerms(oldStyle.furnitureBrandsEn),
                    termsZh: ensureThreeTerms(oldStyle.furnitureBrandsZh)
                };
                let detail2: DynamicDetailSet = {
                    labelEn: newSettingsState.uiTexts.styleEditorDecorTipsLabel?.textEn || "Decor Tips",
                    labelZh: newSettingsState.uiTexts.styleEditorDecorTipsLabel?.textZh || "佈置技巧",
                    termsEn: ensureThreeTerms(oldStyle.decorTipsEn),
                    termsZh: ensureThreeTerms(oldStyle.decorTipsZh)
                };

                const { furnitureBrandsEn, furnitureBrandsZh, decorTipsEn, decorTipsZh, ...restOfStyle } = oldStyle;

                return {
                    ...restOfStyle,
                    descriptionEn: style.descriptionEn || '',
                    descriptionZh: style.descriptionZh || '',
                    dynamicDetails: [detail1, detail2] as [DynamicDetailSet, DynamicDetailSet]
                };
            });
        } else {
            newSettingsState.designStyles = [];
            changed = true;
        }

        return changed ? newSettingsState : prevSettings;
    });
  }, []);


  const saveSettingsToLocalStorage = useCallback((currentSettings: AppSettings) => {
    try {
      const settingsToStore: StoredAppSettings = {
        imageGeneration: currentSettings.imageGeneration,
        aiSystemPrompts: currentSettings.aiSystemPrompts,
        uiTexts: currentSettings.uiTexts,
        customPromptCategorySettings: currentSettings.customPromptCategorySettings,
        designStyles: currentSettings.designStyles,
        roomTypes: currentSettings.roomTypes,
        appContextThemeEn: currentSettings.appContextThemeEn,
        appContextThemeZh: currentSettings.appContextThemeZh,
      };
      localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settingsToStore));
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  }, []);

  const saveSettingsGlobal = useCallback(() => {
    saveSettingsToLocalStorage(settings);
  }, [settings, saveSettingsToLocalStorage]);


  const updateSettingsAndSave = useCallback((newSettingsOrUpdater: Partial<AppSettings> | ((prevState: AppSettings) => AppSettings)) => {
    setSettings(prevState => {
        const newState = typeof newSettingsOrUpdater === 'function'
            ? newSettingsOrUpdater(prevState)
            : deepMerge(prevState, newSettingsOrUpdater);
        saveSettingsToLocalStorage(newState);
        return newState;
    });
  }, [saveSettingsToLocalStorage]);

  const resetAISystemPrompts = useCallback(() => updateSettingsAndSave(prev => ({...prev, aiSystemPrompts: JSON.parse(JSON.stringify(DEFAULT_AI_SYSTEM_PROMPTS)) })), [updateSettingsAndSave]);
  const resetImageGenerationSettings = useCallback(() => updateSettingsAndSave(prev => ({...prev, imageGeneration: JSON.parse(JSON.stringify(DEFAULT_IMAGE_GENERATION_SETTINGS)) })), [updateSettingsAndSave]);
  const resetUITexts = useCallback(() => updateSettingsAndSave(prev => ({...prev, uiTexts: JSON.parse(JSON.stringify(DEFAULT_UI_TEXTS)) })), [updateSettingsAndSave]);
  const resetCustomPromptCategorySettings = useCallback(() => updateSettingsAndSave(prev => ({...prev, customPromptCategorySettings: JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS)) })), [updateSettingsAndSave]);
  const resetDesignStyles = useCallback(() => updateSettingsAndSave(prev => ({...prev, designStyles: JSON.parse(JSON.stringify(INITIAL_DESIGN_STYLES_CONST)) })), [updateSettingsAndSave]);
  const resetRoomTypes = useCallback(() => updateSettingsAndSave(prev => ({...prev, roomTypes: JSON.parse(JSON.stringify(INITIAL_ROOM_TYPES_CONST)) })), [updateSettingsAndSave]);

  const resetAllSettingsToDefaults = useCallback(() => {
    const factoryDefaultSettings = JSON.parse(JSON.stringify(initialAppSettings));
    setSettings(factoryDefaultSettings);
    saveSettingsToLocalStorage(factoryDefaultSettings);
  }, [saveSettingsToLocalStorage]);

  const addPromptCategory = useCallback((categoryData: Omit<CustomPromptCategorySetting, 'terms' | 'id'> & { id?: string }): boolean => {
    let success = false;
    updateSettingsAndSave(prev => {
      const providedId = categoryData.id?.trim();
      let finalId = providedId;

      if (!finalId) {
        finalId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      if (prev.customPromptCategorySettings[finalId]) {
        if (providedId && providedId === finalId) {
          console.warn(`Category with provided ID ${finalId} already exists.`);
        } else {
          console.warn(`Generated category ID ${finalId} conflicts. This is unlikely but possible.`);
        }
        success = false;
        return prev;
      }

      const newCategory: CustomPromptCategorySetting = {
        nameEn: categoryData.nameEn,
        nameZh: categoryData.nameZh,
        isOpenDefault: categoryData.isOpenDefault,
        id: finalId,
        terms: [],
      };
      
      const updatedDesignStyles = (prev.designStyles || []).map(style => {
        // Ensure relatedCategories exists and is an array, then add the new ID
        const currentRelated = Array.isArray(style.relatedCategories) ? style.relatedCategories : [];
        const newRelatedCategories = Array.from(new Set([...currentRelated, newCategory.id]));
        return { ...style, relatedCategories: newRelatedCategories };
      });

      success = true;
      return {
        ...prev,
        customPromptCategorySettings: {
          ...prev.customPromptCategorySettings,
          [newCategory.id]: newCategory,
        },
        designStyles: updatedDesignStyles, // Include updated designStyles
      };
    });
    return success;
  }, [updateSettingsAndSave]);

  const deletePromptCategory = useCallback((categoryId: string) => {
    updateSettingsAndSave(prev => {
      const newCategories = { ...prev.customPromptCategorySettings };
      delete newCategories[categoryId];
      
      // Also remove this categoryId from all designStyles' relatedCategories
      const updatedDesignStyles = (prev.designStyles || []).map(style => {
        const newRelatedCategories = (style.relatedCategories || []).filter(id => id !== categoryId);
        return { ...style, relatedCategories: newRelatedCategories };
      });

      return {
        ...prev,
        customPromptCategorySettings: newCategories,
        designStyles: updatedDesignStyles,
      };
    });
  }, [updateSettingsAndSave]);


  const updateCategoryTerms = useCallback((categoryId: string, newTerms: PromptTerm[]) => {
    updateSettingsAndSave(prev => ({
      ...prev,
      customPromptCategorySettings: {
        ...prev.customPromptCategorySettings,
        [categoryId]: {
          ...prev.customPromptCategorySettings[categoryId],
          terms: newTerms.map(term => ({...term, categoryId: categoryId}))
        }
      }
    }));
  }, [updateSettingsAndSave]);

  const addTermToCategory = useCallback((term: PromptTerm, categoryId: string) => {
    updateSettingsAndSave(prev => {
      const category = prev.customPromptCategorySettings[categoryId];
      if (!category) return prev;
      const termWithCorrectCategory = { ...term, categoryId: categoryId };
      const updatedTerms = [...category.terms, termWithCorrectCategory];
      return {
        ...prev,
        customPromptCategorySettings: {
          ...prev.customPromptCategorySettings,
          [categoryId]: { ...category, terms: updatedTerms }
        }
      };
    });
  }, [updateSettingsAndSave]);

  const addMultipleTermsToCategory = useCallback((categoryId: string, termsToAdd: PromptTerm[]) => {
    updateSettingsAndSave(prev => {
      const category = prev.customPromptCategorySettings[categoryId];
      if (!category) {
        console.warn(`Category with ID ${categoryId} not found. Cannot add terms.`);
        return prev;
      }

      const newTermsForCategory = termsToAdd.map(term => ({
        ...term,
        categoryId: categoryId,
        isCustom: term.isCustom !== undefined ? term.isCustom : true,
      }));

      const existingTermIds = new Set(category.terms.map(t => t.id));
      const uniqueNewTerms = newTermsForCategory.filter(term => !existingTermIds.has(term.id));

      if (uniqueNewTerms.length === 0) {
        return prev;
      }

      return {
        ...prev,
        customPromptCategorySettings: {
          ...prev.customPromptCategorySettings,
          [categoryId]: {
            ...category,
            terms: [...category.terms, ...uniqueNewTerms]
          }
        }
      };
    });
  }, [updateSettingsAndSave]);

  const updateTermDefinition = useCallback((termIdToUpdate: string, updates: Partial<PromptTerm>, newCategoryIdIfMoving?: string) => {
    let successfullyUpdatedId: string | null = null;
    updateSettingsAndSave(prev => {
        const newSettings = { ...prev, customPromptCategorySettings: { ...prev.customPromptCategorySettings } };
        let originalCategoryId: string | undefined;
        let termToUpdate: PromptTerm | undefined;

        for (const catId in newSettings.customPromptCategorySettings) {
            const category = newSettings.customPromptCategorySettings[catId];
            const termIndex = category.terms.findIndex(t => t.id === termIdToUpdate);
            if (termIndex !== -1) {
                originalCategoryId = catId;
                termToUpdate = category.terms[termIndex];
                break;
            }
        }

        if (!originalCategoryId || !termToUpdate) {
            console.error("Term to update not found in any category:", termIdToUpdate);
            successfullyUpdatedId = null;
            return prev;
        }

        const updatedTerm = { ...termToUpdate, ...updates, isCustom: true };

        if (newCategoryIdIfMoving && newCategoryIdIfMoving !== originalCategoryId) {
            newSettings.customPromptCategorySettings[originalCategoryId] = {
                ...newSettings.customPromptCategorySettings[originalCategoryId],
                terms: newSettings.customPromptCategorySettings[originalCategoryId].terms.filter(t => t.id !== termIdToUpdate)
            };
            const finalTermForNewCategory = { ...updatedTerm, categoryId: newCategoryIdIfMoving, id: updates.id || termIdToUpdate };

            newSettings.customPromptCategorySettings[newCategoryIdIfMoving] = {
                ...newSettings.customPromptCategorySettings[newCategoryIdIfMoving],
                terms: [...newSettings.customPromptCategorySettings[newCategoryIdIfMoving].terms, finalTermForNewCategory]
            };
            successfullyUpdatedId = finalTermForNewCategory.id;
        } else {
            newSettings.customPromptCategorySettings[originalCategoryId].terms =
                newSettings.customPromptCategorySettings[originalCategoryId].terms.map(t =>
                    t.id === termIdToUpdate ? { ...updatedTerm, categoryId: originalCategoryId } : t
                );
            successfullyUpdatedId = updatedTerm.id;
        }
        return newSettings;
    });
    return successfullyUpdatedId;
  }, [updateSettingsAndSave]);

  const deleteTermFromCategory = useCallback((termId: string, categoryId: string) => {
    updateSettingsAndSave(prev => {
      const category = prev.customPromptCategorySettings[categoryId];
      if (!category) return prev;
      const updatedTerms = category.terms.filter(term => term.id !== termId);
      return {
        ...prev,
        customPromptCategorySettings: {
          ...prev.customPromptCategorySettings,
          [categoryId]: { ...category, terms: updatedTerms }
        }
      };
    });
  }, [updateSettingsAndSave]);

  const addDesignStyle = useCallback((style: DesignStyle) => {
    updateSettingsAndSave(prev => ({
      ...prev,
      designStyles: [...(Array.isArray(prev.designStyles) ? prev.designStyles : []), { ...style, isCustom: style.isCustom !== undefined ? style.isCustom : true }]
    }));
  }, [updateSettingsAndSave]);

  const updateDesignStyle = useCallback((styleId: string, updates: Partial<DesignStyle>) => {
    updateSettingsAndSave(prev => ({
      ...prev,
      designStyles: (Array.isArray(prev.designStyles) ? prev.designStyles : []).map(style =>
        style.id === styleId ? { ...style, ...updates, isCustom: true } : style
      )
    }));
  }, [updateSettingsAndSave]);

  const deleteDesignStyle = useCallback((styleId: string) => {
    updateSettingsAndSave(prev => ({
      ...prev,
      designStyles: (Array.isArray(prev.designStyles) ? prev.designStyles : []).filter(style => style.id !== styleId)
    }));
  }, [updateSettingsAndSave]);

  const deleteTermFromStyleDetail = useCallback((styleId: string, detailSetIndex: 0 | 1, termIndex: number) => {
    updateSettingsAndSave(prev => {
      const newStyles = (prev.designStyles || []).map(style => {
        if (style.id === styleId) {
          const newDynamicDetails = [...style.dynamicDetails] as [DynamicDetailSet, DynamicDetailSet];
          if (newDynamicDetails[detailSetIndex] && newDynamicDetails[detailSetIndex].termsEn && newDynamicDetails[detailSetIndex].termsZh) {
            const newTermsEn = [...newDynamicDetails[detailSetIndex].termsEn];
            const newTermsZh = [...newDynamicDetails[detailSetIndex].termsZh];

            if (termIndex >= 0 && termIndex < newTermsEn.length) {
              newTermsEn[termIndex] = '';
            }
            if (termIndex >= 0 && termIndex < newTermsZh.length) {
              newTermsZh[termIndex] = '';
            }

            newDynamicDetails[detailSetIndex] = {
              ...newDynamicDetails[detailSetIndex],
              termsEn: newTermsEn,
              termsZh: newTermsZh,
            };
            return { ...style, dynamicDetails: newDynamicDetails, isCustom: true };
          }
        }
        return style;
      });
      return { ...prev, designStyles: newStyles };
    });
  }, [updateSettingsAndSave]);

  const addRoomType = useCallback((roomType: PromptTerm) => {
    updateSettingsAndSave(prev => ({
      ...prev,
      roomTypes: [...(Array.isArray(prev.roomTypes) ? prev.roomTypes : []), { ...roomType, isCustom: roomType.isCustom !== undefined ? roomType.isCustom : true }]
    }));
  }, [updateSettingsAndSave]);

  const updateRoomTypes = useCallback((newRoomTypes: PromptTerm[]) => {
    updateSettingsAndSave(prev => ({
      ...prev,
      roomTypes: newRoomTypes
    }));
  }, [updateSettingsAndSave]);

  const deleteRoomType = useCallback((roomTypeId: string) => {
    updateSettingsAndSave(prev => ({
      ...prev,
      roomTypes: (Array.isArray(prev.roomTypes) ? prev.roomTypes : []).filter(rt => rt.id !== roomTypeId)
    }));
  }, [updateSettingsAndSave]);

  const setAppContextTheme = useCallback((themeEn: string, themeZh: string) => {
    updateSettingsAndSave(prev => ({ ...prev, appContextThemeEn: themeEn, appContextThemeZh: themeZh }));
  }, [updateSettingsAndSave]);

  // Cached Profile Management Functions
  const addCachedProfile = useCallback((name: string, settingsSnapshot: StoredAppSettings, thumbnailDataUrl?: string) => {
    const newProfile: CachedProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      name,
      settings: settingsSnapshot,
      thumbnailDataUrl,
      createdAt: Date.now(),
    };
    setCachedProfiles(prev => [...prev.filter(p => p.id !== FACTORY_DEFAULT_PROFILE_ID), newProfile].sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const loadCachedProfileIntoModal = useCallback((profileId: string): StoredAppSettings | null => {
    if (profileId === FACTORY_DEFAULT_PROFILE_ID) {
        return JSON.parse(JSON.stringify(initialAppSettings)); // Return a deep copy of initial settings
    }
    const profile = cachedProfiles.find(p => p.id === profileId);
    if (profile) {
        return JSON.parse(JSON.stringify(profile.settings));
    }
    return null;
  }, [cachedProfiles]);


  const deleteCachedProfile = useCallback((profileId: string) => {
    if (profileId === FACTORY_DEFAULT_PROFILE_ID) return; // Prevent deleting factory default
    setCachedProfiles(prev => prev.filter(p => p.id !== profileId));
  }, []);

  const updateCachedProfileThumbnail = useCallback((profileId: string, thumbnailDataUrl: string) => {
    if (profileId === FACTORY_DEFAULT_PROFILE_ID) return;
    setCachedProfiles(prev => prev.map(p => p.id === profileId ? { ...p, thumbnailDataUrl } : p));
  }, []);

  const updateCachedProfileName = useCallback((profileId: string, newName: string) => {
    if (profileId === FACTORY_DEFAULT_PROFILE_ID) return;
    setCachedProfiles(prev => prev.map(p => p.id === profileId ? { ...p, name: newName } : p));
  }, []);

  const clearAllCachedProfiles = useCallback(() => {
    setCachedProfiles([]); // This will clear only user-added profiles, factory default is handled elsewhere
  }, []);


  const value = {
    settings,
    updateSettings: updateSettingsAndSave,
    saveSettings: saveSettingsGlobal,
    resetAISystemPrompts,
    resetImageGenerationSettings,
    resetUITexts,
    resetCustomPromptCategorySettings,
    resetDesignStyles,
    resetRoomTypes,
    resetAllSettingsToDefaults,

    addPromptCategory,
    deletePromptCategory,
    updateCategoryTerms,
    addTermToCategory,
    addMultipleTermsToCategory,
    updateTermDefinition,
    deleteTermFromCategory,

    addDesignStyle,
    updateDesignStyle,
    deleteDesignStyle,
    deleteTermFromStyleDetail,

    addRoomType,
    updateRoomTypes,
    deleteRoomType,

    setAppContextTheme,

    cachedProfiles,
    addCachedProfile,
    loadCachedProfileIntoModal,
    deleteCachedProfile,
    updateCachedProfileThumbnail,
    updateCachedProfileName,
    clearAllCachedProfiles,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
