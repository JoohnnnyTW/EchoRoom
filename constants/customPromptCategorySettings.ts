import { CustomPromptCategorySettings, PromptTerm } from '../types'; 
import { PROMPT_CATEGORIES as DESIGN_DATA_PROMPT_CATEGORIES_IMPORTED, PromptCategoryDefinition } from './designData';

// Ensure DESIGN_DATA_PROMPT_CATEGORIES is an array before using .reduce()
// This helps prevent runtime errors if DESIGN_DATA_PROMPT_CATEGORIES_IMPORTED is undefined due to module loading issues.
const DESIGN_DATA_PROMPT_CATEGORIES: PromptCategoryDefinition[] = Array.isArray(DESIGN_DATA_PROMPT_CATEGORIES_IMPORTED) 
  ? DESIGN_DATA_PROMPT_CATEGORIES_IMPORTED 
  : [];

export const DEFAULT_CUSTOM_PROMPT_CATEGORY_SETTINGS: CustomPromptCategorySettings = 
  DESIGN_DATA_PROMPT_CATEGORIES.reduce((acc: CustomPromptCategorySettings, category: PromptCategoryDefinition) => {
    // Ensure all terms have a categoryId matching the parent category
    const termsWithCategoryId: PromptTerm[] = category.terms.map(term => ({
      ...term,
      categoryId: category.id // Assign parent categoryId to each term
    }));

    acc[category.id] = {
      id: category.id,
      nameEn: category.nameEn,
      nameZh: category.nameZh,
      isOpenDefault: category.isOpen, // Map from PromptCategoryDefinition.isOpen
      terms: termsWithCategoryId, // Store the actual terms here
    };
    return acc;
  }, {});