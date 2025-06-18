
import { AISystemPrompts, AIInteractionPrompt } from '../types';

export const DEFAULT_AI_SYSTEM_PROMPTS: AISystemPrompts = {
  styleDetails: {
    id: 'styleDetails',
    name: 'AI 風格詳細資訊生成',
    description: '為選定的設計風格生成描述、動態標籤及對應提示詞。JSON輸出。',
    template: `您是一位頂尖的創意內容与室內設計風格分析師。
針對設計風格：「{{styleNameEn}} / {{styleNameZh}}」（基礎提示詞：「{{basePromptEn}}」 / 「{{basePromptZh}}」），並考慮到以下「產業主題/應用脈絡」：「{{industryContext}}」。

請執行以下多階段分析与生成流程：

階段一：風格描述生成
根據上述風格名稱、基礎提示詞和「{{industryContext}}」，生成一段精煉且具吸引力的風格描述。
- 英文描述 (descriptionEn): 約 50-80 字。
- 繁體中文描述 (descriptionZh): 約 50-80 字。

階段二：動態標籤主體生成
基於階段一生成的風格描述和「{{industryContext}}」，構思兩組獨特的「細節標籤主體」。
- **重要指令**：
    - 如果「{{industryContext}}」是具體的（例如：“平面設計”、“科幻遊戲美術”、“餐飲品牌形象”、“電商產品展示”），則這兩組標籤的名稱（英文 labelEn 及繁中 labelZh）**必須顯著區別於**通用的“家具/品牌(Furniture/Brands)”或“裝飾/技巧(Decor/Tips)”或“建議材質與元素 (Suggested Materials & Elements)”或“關鍵特色與氛圍 (Key Features & Atmosphere)”。標籤必須与「{{industryContext}}」高度相關、專業且具體。例如，若「{{industryContext}}」是“平面設計”，標籤可以是“建議軟體資源/設計技巧 (Suggested Software & Resources / Design Techniques)”或“排版風格/色彩理論 (Typography Styles / Color Theory Applications)”。若「{{industryContext}}」是“科幻遊戲美術”，標籤可以是“異星材質/科技紋理 (Alien Materials / Tech Textures)”或“未來載具細節/武器設計元素 (Futuristic Vehicle Details / Weapon Design Elements)”。
    - 如果「{{industryContext}}」是通用的室內設計，或者您判斷通用標籤最為合適，則可以使用如“建議材質與元素 (Suggested Materials & Elements)”和“關鍵特色與氛圍 (Key Features & Atmosphere)”等較通用的標籤。
- 為每組動態標籤提供英文名稱 (labelEn) 和繁體中文名稱 (labelZh)。

階段三：動態標籤提示詞生成
針對階段二生成的每一組動態標籤，參考階段一的風格描述和「{{industryContext}}」，為其分別生成剛好三個「可選提示詞」。這些提示詞在每一組內必須是互不相同的。
- 每個提示詞需提供英文 (termsEn 陣列中的字串) 和繁體中文 (termsZh 陣列中的字串)。
- 提示詞應簡潔有力，適合用於 AI 圖像生成，並且与其所屬的動態標籤主題緊密相關。
- **確保每一組 (termsEn 和 termsZh 各自) 內的三個提示詞是 distinct (互不相同) 的。**

最終檢查與輸出格式：
請再次檢查，確保階段二生成的動態標籤名稱（labelEn, labelZh）在特定「{{industryContext}}」下確實具有獨特性，而非僅僅是“家具”或“技巧”的簡單同義詞轉換或与通用標籤雷同。如果AI判斷其生成的標籤對於特定脈絡顯得過於通用或不夠創新，AI應該返回階段二重新構思更具體的標籤名稱及其對應的提示詞。这个「重新思考」的過程由 AI 內部根據提示詞的指引完成。

您的回應必須「僅僅是」一個 JSON 物件，不包含任何額外文字、註解或 Markdown 標記。JSON 物件結構如下：
{
  "descriptionEn": "階段一生成的英文風格描述。",
  "descriptionZh": "階段一生成的繁體中文風格描述。",
  "dynamicDetail1": {
    "labelEn": "階段二生成的第一組動態標籤的英文名稱",
    "labelZh": "階段二生成的第一組動態標籤的繁體中文名稱",
    "termsEn": ["英文提示詞1.1", "英文提示詞1.2", "英文提示詞1.3"],
    "termsZh": ["繁中提示詞1.1", "繁中提示詞1.2", "繁中提示詞1.3"]
  },
  "dynamicDetail2": {
    "labelEn": "階段二生成的第二組動態標籤的英文名稱",
    "labelZh": "階段二生成的第一組動態標籤的繁體中文名稱",
    "termsEn": ["英文提示詞2.1", "英文提示詞2.2", "英文提示詞2.3"],
    "termsZh": ["繁中提示詞2.1", "繁中提示詞2.2", "繁中提示詞2.3"]
  }
}
確保每個 termsEn 和 termsZh 陣列都剛好包含三個字串項目。確保所有字串值不為空。`,
    placeholders: ['{{styleNameEn}}', '{{styleNameZh}}', '{{basePromptEn}}', '{{basePromptZh}}', '{{industryContext}}'],
  },
  aiStyleSetSuggestion: {
    id: 'aiStyleSetSuggestion',
    name: 'AI 新增設計風格建議',
    description: '根據應用程式主題，建議一個新的設計風格。JSON輸出單個物件。',
    template: `You are an expert AI system for generating a new foundational design style.
The application's current theme/industry context is: "{{appContextThemeEn}} / {{appContextThemeZh}}".
A list of existing style names (format: "English Name (Chinese Name)") is: {{existingStyleNamesJSON}}.

Please generate ONE unique design style that would be an excellent addition for this theme.
The style should:
1. Be distinct from common existing styles AND not be a duplicate of any name in '{{existingStyleNamesJSON}}'.
2. Be highly relevant to the "{{appContextThemeEn}} / {{appContextThemeZh}}" context.
3. Prioritize well-known or classic style names if appropriate for the theme, or suggest a uniquely fitting name if the theme is niche. Ensure the generated English name (nameEn) and Chinese name (nameZh) and their combination do not appear in '{{existingStyleNamesJSON}}'.

Provide the style as a single JSON object with the following fields:
- id: A unique string ID, prefixed with "core_style_", incorporating the English theme and a timestamp or random element (e.g., "core_style_{{appContextThemeEn}}_uniquePart"). Use underscores for spaces in the theme part of the ID. Example: "core_style_biophilic_urban_oasis_${Date.now()}"
- nameEn: The English name of the style.
- nameZh: The Traditional Chinese name of the style.
- basePromptEn: A concise English base prompt encapsulating the style.
- basePromptZh: A concise Traditional Chinese base prompt encapsulating the style.
- isCustom: This MUST be false.
- relatedCategories: An array of all available category IDs, which will be provided as "{{categoryIdsJSON}}". You should parse this JSON string and include all listed IDs in the relatedCategories array for the style you generate.
- descriptionEn: An empty string "".
- descriptionZh: An empty string "".
- dynamicDetails: An array containing two objects, each with "labelEn": "Details 1", "labelZh": "細節 1", "termsEn": ["", "", ""], "termsZh": ["", "", ""].

Output ONLY a single valid JSON object representing this DesignStyle. Do not include any other text, comments, or markdown.
Example of the output (ensure 'isCustom' is false, descriptions are empty, dynamicDetails terms are empty strings):
{
  "id": "core_style_solar_punk_living_${Date.now()}",
  "nameEn": "Solarpunk Oasis Living",
  "nameZh": "太陽龐克綠洲生活",
  "basePromptEn": "Solarpunk aesthetic, integrated greenery, sustainable technology, bright airy interiors",
  "basePromptZh": "太陽龐克美學，融合綠植，永續科技，明亮通風的室內",
  "isCustom": false,
  "relatedCategories": ["materials", "lighting", "photography"], 
  "descriptionEn": "",
  "descriptionZh": "",
  "dynamicDetails": [
    { "labelEn": "Details 1", "labelZh": "細節 1", "termsEn": ["", "", ""], "termsZh": ["", "", ""] },
    { "labelEn": "Details 2", "labelZh": "細節 2", "termsEn": ["", "", ""], "termsZh": ["", "", ""] }
  ]
}`,
    placeholders: ['{{appContextThemeEn}}', '{{appContextThemeZh}}', '{{existingStyleNamesJSON}}', '{{categoryIdsJSON}}'],
  },
  aiRoomTypeSetSuggestion: {
    id: 'aiRoomTypeSetSuggestion',
    name: 'AI 新增空間/區域類型建議',
    description: '根據應用程式主題，建議一個新的空間/區域類型。JSON輸出單個物件。',
    template: `You are an expert AI system for generating a context-specific room or area type.
The application's current theme/industry context is: "{{appContextThemeEn}} / {{appContextThemeZh}}".
A list of existing room/area type names (format: "English Name (Chinese Name)") is: {{existingRoomTypeNamesJSON}}.

Please generate ONE unique room/area type that is highly relevant to this theme.
The room/area type should:
1. Be distinct and provide a useful option.
2. NOT be a duplicate of any name in '{{existingRoomTypeNamesJSON}}'.
3. Prioritize common or classic room/area names if appropriate for the theme, or suggest a uniquely fitting name if the theme is niche. Ensure the generated English name (termEn) and Chinese name (termZh) and their combination do not appear in '{{existingRoomTypeNamesJSON}}'.

Provide the room/area type as a single JSON object with the following fields:
- id: A unique string ID, prefixed with "core_roomtype_theme_", incorporating the English theme and a timestamp or random element (e.g., "core_roomtype_theme_{{appContextThemeEn}}_uniquePart"). Use underscores for spaces in the theme part of the ID. Example: "core_roomtype_theme_cyberpunk_bar_area_${Date.now()}"
- termEn: The English name of the room/area type.
- termZh: The Traditional Chinese name of the room/area type.
- isCustom: This MUST be false.

Output ONLY a single valid JSON object representing this PromptTerm. Do not include any other text, comments, or markdown.
Example for "{{appContextThemeEn}}" = "Cyberpunk Night Market":
{ 
  "id": "core_roomtype_theme_cyberpunk_night_market_food_stall_${Date.now()}", 
  "termEn": "Holographic Food Stall", 
  "termZh": "全息投影小吃攤", 
  "isCustom": false 
}`,
    placeholders: ['{{appContextThemeEn}}', '{{appContextThemeZh}}', '{{existingRoomTypeNamesJSON}}'],
  },
  translateToEnglish: {
    id: 'translateToEnglish',
    name: '翻譯至英文',
    description: '將輸入的繁體中文文字翻譯為簡潔的英文。僅返回翻譯結果。',
    template: `Translate the following Traditional Chinese keyword/phrase/sentence to its concise English equivalent. Return only the English translation, without any explanations or quotation marks. Input: "{{textToTranslate}}" Output:`,
    placeholders: ['{{textToTranslate}}'],
  },
  translateToChinese: {
    id: 'translateToChinese',
    name: '翻譯至繁體中文',
    description: '將輸入的英文文字翻譯為簡潔的繁體中文。僅返回翻譯結果。',
    template: `Translate the following English keyword/phrase/sentence to its concise Traditional Chinese equivalent. Return only the Traditional Chinese translation, without any explanations or quotation marks. Input: "{{textToTranslate}}" Output:`,
    placeholders: ['{{textToTranslate}}'],
  },
  translateStyleNameToEnglish: {
    id: 'translateStyleNameToEnglish',
    name: '風格名稱翻譯至英文',
    description: '將設計風格的繁體中文名稱翻譯為英文。僅返回翻譯結果。',
    template: `Translate the following Traditional Chinese interior design style name to English. Return only the concise English name, without any explanations or quotation marks. Input: "{{nameZh}}" Output:`,
    placeholders: ['{{nameZh}}'],
  },
  polishPromptEn: {
    id: 'polishPromptEn',
    name: '潤飾英文提示詞',
    description: '優化已生成的英文AI圖像提示詞，使其更生動、描述性強。僅返回優化後提示詞。',
    template: `You are an expert AI prompt engineer for the Imagen 3 image generation model.
Refine the following English prompt for "{{appContextThemeEn}}" AI image generation: "{{promptToPolish}}".
Optimize it based on Imagen 3 best practices:
1.  **Structure**: Ensure a clear SUBJECT, CONTEXT/BACKGROUND, and STYLE. Example structure: "A [STYLE] of a [SUBJECT] [CONTEXT/BACKGROUND]."
2.  **Clarity and Specificity**: Use vivid, descriptive keywords and modifiers. Be precise.
3.  **Artistic/Photographic Elements**: If relevant, enhance terms related to camera angles (e.g., wide-angle shot, eye-level), lens types, lighting (e.g., golden hour, cinematic lighting, soft diffused light), art styles (e.g., impressionist, art deco), or render styles (e.g., photorealistic, concept art).
4.  **Conciseness for In-Image Text**: If the prompt implies text within the image, ensure it's very brief (e.g., a sign name).
5.  **Effectiveness**: The goal is a high-quality, detailed, and accurate image.
Return ONLY the refined English prompt, with no additional explanations, comments, or markdown.`,
    placeholders: ['{{promptToPolish}}', '{{appContextThemeEn}}'],
  },
  polishPromptZh: {
    id: 'polishPromptZh',
    name: '潤飾中文提示詞',
    description: '優化已生成的繁體中文AI圖像提示詞，使其更生動、描述性強。僅返回優化後提示詞。',
    template: `您是一位專業的 AI 提示詞工程師，專為 Imagen 3 圖像生成模型服務。
請潤飾以下繁體中文的「{{appContextThemeZh}}」AI圖像生成提示詞：「{{promptToPolish}}」。
根據 Imagen 3 的最佳實踐進行優化：
1.  **結構性**：確保提示詞包含清晰的「主題」(Subject)、「情境/背景」(Context/Background) 和「風格」(Style)。例如結構：「一幅關於 [主體] 的 [風格] 作品，[情境/背景]。」
2.  **清晰度與具體性**：使用生動、描述性強的關鍵字和修飾詞，力求精確。
3.  **藝術性/攝影性元素**：如相關，強化與相機角度（例如：廣角、水平視角）、鏡頭類型、光線（例如：黃金時刻、電影感光效、柔和漫射光）、藝術風格（例如：印象派、裝飾藝術風）或渲染風格（例如：照片級寫實、概念藝術）相關的詞彙。
4.  **圖中文字的簡潔性**：如果提示詞意圖在圖像中生成文字，確保文字內容非常簡短（例如：招牌名稱）。
5.  **效果**：目標是生成高品質、細節豐富且準確的圖像。
請「僅僅」返回優化後的繁體中文提示詞，不含任何額外的解釋、註解或 Markdown 標記。`,
    placeholders: ['{{promptToPolish}}', '{{appContextThemeZh}}'],
  },
  aiTermSuggestions: { 
    id: 'aiTermSuggestions',
    name: 'AI 提示詞建議',
    description: '根據當前風格、空間和已選詞語，建議5-7個新的相關提示詞。JSON輸出。',
    template: `您是一位專業的「{{appContextThemeEn}} / {{appContextThemeZh}}」提示詞助手。
使用者選擇的風格是：「{{styleNameEn}} / {{styleNameZh}}」，空間類型是：「{{roomTypeEn}} / {{roomTypeZh}}」。
目前已選用的提示詞有：{{currentTerms}}。
**使用者的特定主體建議參考文字 (用於引導以下詞語建議的整體方向，如果提供的話):** {{subjectSuggestionSeedText}}

請建議5-7個獨特且互補的提示詞（關鍵字或短語），包含英文和繁體中文，以增強此「{{appContextThemeEn}} / {{appContextThemeZh}}」的AI圖像生成提示詞效果。
重點關注：
- 符合風格但通常未列出的特定材料。
- 獨特的裝飾品或特徵。
- 氛圍或情緒描述詞。
- 特定的照明品質。
- 增添真實感或藝術感的元素。
請勿建議過於通用或已被風格/空間類型暗示的詞語。請勿建議与「目前已選用的提示詞」列表中相似的詞語。
請以有效的JSON陣列物件格式返回建議。每個物件必須具有以下結構：
{ "id": "一個該詞語的唯一字串識別碼 (ai_sugg_開頭)", "termEn": "English Term", "termZh": "繁體中文術語" }
確保 "termEn" 欄位值僅包含英文文字，"termZh" 欄位值僅包含繁體中文文字。JSON 中的任何地方，包括這些欄位值內部，均不應出現任何其他語言的文字或無關字符。
確保JSON格式正確，且僅包含建議物件的陣列。**絕對不要包含任何其他文字、註解或Markdown標記。僅輸出純粹的JSON陣列。**`,
    placeholders: ['{{styleNameEn}}', '{{styleNameZh}}', '{{roomTypeEn}}', '{{roomTypeZh}}', '{{currentTerms}}', '{{subjectSuggestionSeedText}}', '{{appContextThemeEn}}', '{{appContextThemeZh}}'],
  },
  randomPromptSelection: {
    id: 'randomPromptSelection',
    name: 'AI 隨機選詞',
    description: '從可用提示詞列表中，根據當前風格和空間隨機選擇5-7個詞語。JSON輸出選中的ID列表。',
    template: `You are an AI assistant for "{{appContextThemeEn}} / {{appContextThemeZh}}" prompt generation.
Current Style: {{styleNameEn}} / {{styleNameZh}}
Room Type: {{roomTypeEn}} / {{roomTypeZh}}
Available prompt terms (with IDs):
{{availableTermsList}}

Based on the style and room type, please select 5 to 7 diverse and complementary term IDs from the list above that would create a great image for "{{appContextThemeEn}} / {{appContextThemeZh}}".
Prioritize terms that are highly characteristic of the style or offer unique details.
Return a JSON array of selected term IDs, like: ["id1", "id2", "id3", "id4", "id5"].
Ensure the output is only the JSON array.`,
    placeholders: ['{{styleNameEn}}', '{{styleNameZh}}', '{{roomTypeEn}}', '{{roomTypeZh}}', '{{availableTermsList}}', '{{appContextThemeEn}}', '{{appContextThemeZh}}'],
  },
  imageAnalysisForPrompts: {
    id: 'imageAnalysisForPrompts',
    name: '圖像分析以生成提示詞',
    description: '分析上傳的圖像，並根據提供的應用程式上下文主題提取關鍵字/短語，用於生成提示詞。JSON輸出。',
    template: `You are an expert image analyst specializing in "{{analysisContextThemeEn}} / {{analysisContextThemeZh}}".
The user is working within the following application context or theme: "{{analysisContextThemeEn}} / {{analysisContextThemeZh}}". Keep this theme in mind when identifying relevant elements.
Analyze the provided image. Identify key objects, materials, colors, textures, lighting, architectural elements, overall style, and mood relevant to the theme.
For each distinct element or concept you identify, provide a concise keyword or short phrase in both English and Traditional Chinese.
Focus on terms that would be useful for generating a similar image with an AI image generator, and that align with the provided theme if applicable.
Return your findings as a JSON array of objects, where each object has the structure:
{ "termEn": "English Keyword/Phrase", "termZh": "繁體中文關鍵詞/短語" }
Example: If the image shows a "wooden coffee table", output { "termEn": "wooden coffee table", "termZh": "木製咖啡桌" }.
If the theme is "Sci-fi Spaceship Interior", and the image shows a metallic panel, you might identify it as "riveted metal panel" / "鉚接金屬面板" to fit the theme.
Provide at least 5-10 such keyword pairs, but up to 20 if the image is complex and rich in detail.
Ensure "termEn" contains only English and "termZh" contains only Traditional Chinese.
Your entire response must be ONLY this valid JSON array, without any additional explanatory text, comments, or markdown.`,
    placeholders: ['{{analysisContextThemeEn}}', '{{analysisContextThemeZh}}'],
  },
  metaUpdateAllEditableSettings: {
    id: 'metaUpdateAllEditableSettings',
    name: 'AI 驅動的整體設定調整 (進階)',
    description: '根據使用者提供的產業脈絡或特定生圖需求，讓 AI 智慧調整「AI 系統提示詞」、「可編輯的 UI 文字標籤」、「提示詞分類與詞語」的內容、「預設設計風格」的內容，以及「空間類型」的提示詞。此為進階功能，請謹慎使用並檢閱結果。',
    template: `You are an expert AI configuration assistant for an image prompt generation application.
The user wants to tailor the application's settings to better suit a specific "Industry Context / Image Generation Requirement": "{{industryContext}}".

You will be provided with the current application settings in JSON format. Your primary goal is to **generate new content** that is **highly specific and authentic to the "{{industryContext}}"**, often by **completely replacing** the original thematic essence of the provided current settings.

**CRITICAL**: If the "{{industryContext}}" is primarily in Chinese, ensure all generated Chinese text (nameZh, termZh, textZh, basePromptZh, appContextThemeZh) is accurate and natural-sounding Traditional Chinese. If primarily English, ensure English text is excellent.

1.  **Application Context Theme Generation:**
    - User's input theme: "{{industryContext}}".
    - Generate \`updatedAppContextThemeEn\`: This MUST be the direct English equivalent of "{{industryContext}}". If "{{industryContext}}" is already suitable English, use it as is.
    - Generate \`updatedAppContextThemeZh\`: This MUST be the direct Traditional Chinese equivalent of "{{industryContext}}". If "{{industryContext}}" is already suitable Traditional Chinese, use it as is.
    - **IMPORTANT**: Do not modify or elaborate on "{{industryContext}}". The output themes must be direct translations/transliterations only. For example, if "{{industryContext}}" is "平面設計", \`updatedAppContextThemeZh\` must be "平面設計" and \`updatedAppContextThemeEn\` must be its direct English translation (e.g., "Graphic Design"). Do NOT return "平面設計素材資源" or similar elaborations.

2.  Current AI System Prompts: \`{{currentAISystemPromptsJSON}}\`
    - Modify ONLY the "template" field for each prompt to align with the generated \`updatedAppContextThemeEn\` / \`updatedAppContextThemeZh\`.
    - DO NOT change IDs, names, descriptions, or placeholders.
    - If a template seems already heavily themed by a previous AI run, strive to **re-interpret its purpose freshly** for the new generated application themes.

3.  Current Editable UI Text Labels: \`{{currentEditableUITextsJSON}}\`
    - For each UI text label:
        - **CRITICAL**: The UI text item with id 'headerTitle' MUST NOT be changed. Its 'textEn' and 'textZh' values should remain as provided in \`{{currentEditableUITextsJSON}}\`.
        - For all other UI text labels, modify ONLY "textEn" and "textZh" to align with the generated \`updatedAppContextThemeEn\` / \`updatedAppContextThemeZh\`.
        - **Specifically for "roomTypeSelectorTitle" and "roomTypeSetAISuggestionButtonLabel"**: Generate names that are highly specific to the generated application themes. For example, if the theme is "Restaurant", "roomTypeSelectorTitle" might become "用餐區域 (Dining Areas)" and "roomTypeSetAISuggestionButtonLabel" might become "AI 建議區域組合 (AI Suggest Area Set)".
        - DO NOT change IDs, names, or descriptions for any UI text (except potentially for "roomTypeSelectorTitle" and "roomTypeSetAISuggestionButtonLabel" if their default names/descriptions are too generic).
        - Ensure phrasings are natural and contextually appropriate for the new theme. **If current textEn/textZh seems AI-generated for a *different* theme, generate new text based on the default meaning of the label and the *new* generated application themes**.

4.  Current Prompt Categories and Terms: \`{{currentCustomPromptCategoriesJSON}}\`
    - For each category:
        - **Category Names (nameEn, nameZh)**: Generate COMPLETELY NEW names based on the generated \`updatedAppContextThemeEn\` / \`updatedAppContextThemeZh\`. **IGNORE the thematic content of the current category names** if they seem pre-themed; focus on the new context.
    - For each term within each category:
        - **Term Content (termEn, termZh)**: Generate COMPLETELY NEW English and Chinese term content based on the generated application themes and the term's general role within its category. **IGNORE the thematic content of the current termEn/termZh** if they seem pre-themed.
    - DO NOT change category IDs, term IDs, or "isOpenDefault". DO NOT add/remove categories/terms. Rephrase existing ones based on the NEW context.

5.  Current Design Styles: \`{{currentDesignStylesJSON}}\` (List of default styles)
    Existing Style Names for uniqueness check: \`{{existingStyleNamesJSON}}\`
    - For each design style object in the input array (identified by its "id"):
        - **Style Names (nameEn, nameZh) AND Base Prompts (basePromptEn, basePromptZh)**: Generate COMPLETELY NEW content. This new content must be:
            a. Derived **primarily and FRESHLY from the generated \`updatedAppContextThemeEn\` / \`updatedAppContextThemeZh\`**.
            b. Appropriate for the general concept of a "design style".
            c. **You MUST IGNORE the actual text content of the original nameEn, nameZh, basePromptEn, basePromptZh from the input \`{{currentDesignStylesJSON}}\` if it appears to be already themed or specific from a previous AI run.** Your new names/prompts should freshly embody the generated application themes, not be a modification of the old theme.
            d. The new names should be highly specific and authentic to the generated application themes, sounding like genuine style names or design techniques from that domain.
            e. The generated style names (En, Zh, and combination) **MUST NOT** be present in \`{{existingStyleNamesJSON}}\`.
        - **Related Categories (relatedCategories)**: Suggest a new array of category IDs (chosen exclusively from \`{{availableCategoryIdsJSON}}\`) that are relevant to the **new style name you just generated** and the generated application themes.
    - CRITICALLY IMPORTANT: DO NOT change the "id" of any style. DO NOT change "isCustom" flags. DO NOT add or remove styles from the list.
    - **For "descriptionEn" and "descriptionZh"**: Set these to empty strings ("").
    - **For "dynamicDetails"**: Set this to an array containing exactly two objects, each with the following structure:
      \`{ "labelEn": "Details 1", "labelZh": "細節 1", "termsEn": ["", "", ""], "termsZh": ["", "", ""] }\`
      (The second object should be \`{ "labelEn": "Details 2", "labelZh": "細節 2", "termsEn": ["", "", ""], "termsZh": ["", "", ""] }\`)
      All termsEn and termsZh arrays within dynamicDetails must contain exactly three empty strings.

6.  Current Room Types: \`{{currentRoomTypesJSON}}\` (List of default room types)
    Existing Room Type Names for uniqueness check: \`{{existingRoomTypeNamesJSON}}\`
    - Your task is to return an array named "updatedRoomTypes". This array **MUST contain EXACTLY THE SAME number of objects as in \`{{currentRoomTypesJSON}}\`, and each object MUST correspond to an object in the input array, maintaining its original "id" and "isCustom": false status.**
    - For EACH room type object in \`{{currentRoomTypesJSON}}\`:
        - Generate NEW \`termEn\` (English) and \`termZh\` (Traditional Chinese) that are SPECIFIC, CREATIVE, and HIGHLY RELEVANT to the generated \`updatedAppContextThemeEn\` / \`updatedAppContextThemeZh\`. These new terms should re-theme the original concept of the room type.
        - The new room type names (En, Zh, and combination) **MUST NOT** be present in \`{{existingRoomTypeNamesJSON}}\`.
        - **DO NOT** change the "id" or "isCustom" status. **DO NOT** add new room types or remove existing ones.
        - **CRITICAL**: The new \`termEn\` and \`termZh\` MUST NOT be empty strings.
    - The "updatedRoomTypes" array in your output should be an array of these modified \`PromptTerm\` objects.

7.  List of Available Category IDs for re-linking styles: \`{{availableCategoryIdsJSON}}\`
    - Use this when generating \`relatedCategories\` for \`updatedDesignStyles\`.

Return a single JSON object with the following top-level keys and structures:
\`\`\`json
{
  "updatedAppContextThemeEn": "Generated English App Theme",
  "updatedAppContextThemeZh": "生成的繁中應用程式主題",
  "updatedAISystemPrompts": { /* AISystemPrompts structure */ },
  "updatedUITexts": { /* Complete UITexts structure */ },
  "updatedCustomPromptCategories": { /* CustomPromptCategorySettings structure */ },
  "updatedDesignStyles": [ 
    {
      "id": "style_modern", 
      "nameEn": "Contextual Modern En", "nameZh": "情境化現代風格",
      "basePromptEn": "...", "basePromptZh": "...",
      "relatedCategories": ["cat1_id", "cat2_id"],
      "isCustom": false,
      "descriptionEn": "", 
      "descriptionZh": "",
      "dynamicDetails": [
        { "labelEn": "Details 1", "labelZh": "細節 1", "termsEn": ["", "", ""], "termsZh": ["", "", ""] },
        { "labelEn": "Details 2", "labelZh": "細節 2", "termsEn": ["", "", ""], "termsZh": ["", "", ""] }
      ]
    } 
    /* ... other styles ... */
  ],
  "updatedRoomTypes": [ /* Array of PromptTerm objects (Room Types) */ ]
}
\`\`\`
Ensure your entire response is ONLY this valid JSON object. If a setting seems generally irrelevant to the "{{industryContext}}", make minimal, sensible changes to its text content to reflect a generic or neutral stance, but still include it in the output structure.
`,
    placeholders: [
      '{{industryContext}}',
      '{{currentAISystemPromptsJSON}}',
      '{{currentEditableUITextsJSON}}',
      '{{currentCustomPromptCategoriesJSON}}',
      '{{currentDesignStylesJSON}}',
      '{{existingStyleNamesJSON}}', 
      '{{currentRoomTypesJSON}}',
      '{{existingRoomTypeNamesJSON}}', 
      '{{availableCategoryIdsJSON}}',
    ],
  },
  describeEditedImageForImagen: {
    id: 'describeEditedImageForImagen',
    name: '用AI編輯圖像 - 生成新提示詞',
    description: '根據原始圖像和使用者編輯指令，生成一個全新的、詳細的英文提示詞供 Imagen 使用。',
    template: `You are an expert AI image prompt writer.
The user has provided an existing image and a text instruction to modify it.
Your task is to generate a NEW, DETAILED, and COMPLETE English prompt suitable for the Imagen 3 image generation model. This new prompt should describe the *final desired scene* after the user's modification has been applied to the original image.

Original Image Context: The original image depicts [describe general scene of original image, this will be implicitly understood from the multimodal input].
User's Edit Instruction: "{{userEditInstruction}}"
Application Context/Theme: "{{appContextThemeEn}}"

Based on the visual information from the original image and the user's text instruction, create a new, comprehensive English prompt that fully describes the modified scene.
Focus on:
- Clearly incorporating the user's requested changes.
- Retaining relevant details from the original image that are not contradicted by the edit instruction.
- Using descriptive language for objects, materials, lighting, atmosphere, and style, appropriate for "{{appContextThemeEn}}".
- Ensuring the new prompt is a complete scene description, not just a list of changes.
- The prompt should be suitable for generating a high-quality image with Imagen 3.

Return ONLY the new, complete English prompt. Do not include any explanations, comments, or markdown. Do not refer to "the original image" or "the user's instruction" in the output prompt itself. The output prompt should stand alone as a description of the final scene.`,
    placeholders: ['{{userEditInstruction}}', '{{appContextThemeEn}}'], 
  },
  subjectSuggestion: { 
    id: 'subjectSuggestion',
    name: 'AI 主體內容建議 (使用獨立種子文字)',
    description: '根據獨立的「AI 主體建議參考文字」以及應用主題、風格、空間和已分析圖像的關鍵字，建議主體內容描述。JSON 輸出。',
    template: `You are an AI assistant helping generate main subject descriptions for images, tailoring them to a specific industry context and user input.

**Primary Input (User's Seed Text for AI Subject Suggestions):**
- {{subjectSuggestionSeedText}} 
  (This is the user's specific input for *this* suggestion round. If it states "使用者未提供...", generate general suggestions based on secondary context.)

**Secondary Context (Use to enrich or generate if Primary Input is empty):**
- Overall application theme/industry context: "{{appContextThemeEn}} / {{appContextThemeZh}}"
- Selected style: "{{selectedStyleNameEn}} / {{selectedStyleNameZh}}"
- Selected room type: "{{selectedRoomTypeNameEn}} / {{selectedRoomTypeNameZh}}"
- Recently analyzed image keywords (if any): {{analyzedImageKeywordsString}}
- OCR text from image (if any): {{ocrTextFromImage}}

**Your Task:**
Generate 3-5 diverse and creative subject descriptions. Each description should be a complete phrase suitable as a main subject for an image.

**Prioritization Logic:**
1.  **If the "Primary Input (User's Seed Text for AI Subject Suggestions)" contains specific text from the user:**
    *   Use this seed text as the **sole and primary basis** for your suggestions.
    *   Your suggestions should expand upon, refine, offer alternatives to, or creatively interpret this seed text.
    *   Integrate elements from the "Secondary Context" (theme, style, room type, keywords, OCR text) to enrich these suggestions, ensuring they remain relevant to the "{{appContextThemeEn}} / {{appContextThemeZh}}".
2.  **If the "Primary Input (User's Seed Text for AI Subject Suggestions)" indicates no seed text was provided by the user:**
    *   Use the "Secondary Context" (theme, style, room type, keywords, OCR text) as the primary basis for generating general subject descriptions relevant to the context.

**Industry-Specific Content (Guided by "{{appContextThemeEn}} / {{appContextThemeZh}}"):**
Regardless of prioritization, ensure the subject descriptions incorporate relevant objects, behaviors, or effects specific to the "{{appContextThemeEn}} / {{appContextThemeZh}}". Examples:
- If theme is "產品攝影 (Product Photography)" or similar, include products like 'a sleek smartphone displaying an app', 'wireless headphones on a minimalist stand', 'a high-performance laptop with glowing keyboard', etc.
- If theme is "室內設計 (Interior Design)" or similar, include 'a person reading by a window', 'a cat lounging on a rug', 'a statement armchair', etc.
- If theme is "模特人像攝影 (Model/Portrait Photography)" or similar, include 'a young woman laughing', 'an elderly man with a thoughtful expression', 'a child with a mischievous grin', including details about pose, expression, attire.

**Output Requirements - CRITICAL:**
- Your entire response MUST be a single, valid JSON array of objects.
- Each object in the array MUST have exactly two keys: "suggestionEn" (string) and "suggestionZh" (string).
- The string values for "suggestionEn" MUST be in English.
- The string values for "suggestionZh" MUST be in Traditional Chinese.
- DO NOT include any text, comments, explanations, or markdown formatting before, after, or within the JSON array or its objects.
- The JSON structure must be pure and ready for direct parsing. Example of a valid response:
[{"suggestionEn": "English suggestion 1.", "suggestionZh": "繁體中文建議1。"},{"suggestionEn": "English suggestion 2.", "suggestionZh": "繁體中文建議2。"}]
- No extra keys, no conversational text, no errors, no notes about your process. Just the JSON.
- Focus on specific, tangible details that create a vivid mental image.
- Each suggestion must be provided in both English and Traditional Chinese.
Return ONLY a valid JSON array of objects, each with "suggestionEn" and "suggestionZh" keys.
  Example: [{"suggestionEn": "A detailed close-up of a vintage camera on a rustic wooden table, product photography style.", "suggestionZh": "復古相機在質樸木桌上的細節特寫，產品攝影風格。"}]
Ensure the JSON is well-formed. Do not include any text outside the JSON array, and no extraneous text within the JSON values other than the suggestions themselves.`,
    placeholders: [ 
      '{{subjectSuggestionSeedText}}', 
      '{{appContextThemeEn}}', '{{appContextThemeZh}}',
      '{{selectedStyleNameEn}}',
      '{{selectedStyleNameZh}}',
      '{{selectedRoomTypeNameEn}}',
      '{{selectedRoomTypeNameZh}}',
      '{{analyzedImageKeywordsString}}',
      '{{ocrTextFromImage}}'
    ],
  },
  editInstructionSuggestion: {
    id: 'editInstructionSuggestion',
    name: 'AI 圖像編輯指令建議 (多模態)',
    description: '根據基礎圖像、應用主題和目前輸入，建議圖像編輯指令。JSON 輸出。多模態輸入（圖像+文字）。',
    template: `You are an AI assistant suggesting image editing instructions based on an input image and user context.
The overall application theme/industry context is "{{appContextThemeEn}} / {{appContextThemeZh}}".
The user is currently typing this edit instruction (if any, this provides additional context for your suggestions, otherwise ignore): "{{currentEditText}}".

Analyze the provided base image. Then, considering the application theme and any current edit text from the user, suggest 3-5 diverse and creative editing instructions.
These instructions should focus on modifying elements within the image (e.g., changing colors of objects, altering materials, adjusting weather, modifying actions of people or animals, adding or removing small contextual elements).
The goal is to provide suggestions that would lead to interesting visual changes to the base image, aligned with the "{{appContextThemeEn}} / {{appContextThemeZh}}".

Return ONLY a valid JSON array of objects, where each object has "suggestionEn" (English) and "suggestionZh" (Traditional Chinese) keys.
Example format:
[
  {"suggestionEn": "Change the color of the sofa to a deep blue.", "suggestionZh": "將沙發顏色更改為深藍色。"},
  {"suggestionEn": "Add a small cat sleeping on the armchair.", "suggestionZh": "在扶手椅上添加一隻熟睡的小貓。"},
  {"suggestionEn": "Make the weather outside the window look like a rainy day.", "suggestionZh": "讓窗外的天氣看起來像雨天。"}
]
Ensure the JSON is well-formed and contains ONLY the array. No extra text, comments, or markdown.`,
    placeholders: ['{{appContextThemeEn}}', '{{appContextThemeZh}}', '{{currentEditText}}'], 
  },
  ocrImage: { 
    id: 'ocrImage',
    name: '圖像OCR辨識',
    description: '對提供的圖像進行OCR，提取所有可辨識的文字。僅返回提取的文字。',
    template: `Perform OCR (Optical Character Recognition) on the provided image. Extract all discernible text.
Return ONLY the extracted text as a single string. If no text is found, return an empty string.
Do not include any explanations, comments, or markdown.`,
    placeholders: [], 
  },
  imageFusionSlotDescription: {
    id: 'imageFusionSlotDescription',
    name: '圖像融合工作室 - 圖像關鍵字提取',
    description: '為圖像融合工作室中的圖像提取5-10個中英文視覺關鍵字詞組。JSON輸出。',
    template: `You are an AI image analyst. For the provided image, identify 5-10 key visual elements (objects, materials, colors, textures, overall style, mood).
For each element, provide a concise keyword or short phrase in both English and Traditional Chinese.
Return your findings as a JSON array of objects. Each object in the array must have exactly two keys: "keywordEn" (string) and "keywordZh" (string).
Example:
[
  {"keywordEn": "vintage armchair", "keywordZh": "復古扶手椅"},
  {"keywordEn": "exposed brick wall", "keywordZh": "裸露磚牆"},
  {"keywordEn": "warm natural light", "keywordZh": "溫暖自然光"}
]
Ensure "keywordEn" contains only English and "keywordZh" contains only Traditional Chinese.
Your entire response must be ONLY this valid JSON array, without any additional explanatory text, comments, or markdown.`,
    placeholders: [], 
  },
  imageFusionInstructionSuggestion: {
    id: 'imageFusionInstructionSuggestion',
    name: 'AI 圖像融合/風格轉換指令建議',
    description: '根據多張圖像的關鍵字、選定意圖及應用主題，建議主要編輯指令。JSON 輸出。',
    template: `You are an AI assistant specializing in crafting prompts for advanced image manipulation tasks like image fusion, style transfer, and object replacement using a model like Flux Kontext Max.
The overall application theme/industry context is: "{{appContextThemeEn}} / {{appContextThemeZh}}".

**Image Naming Convention:**
- The image associated with \`{{baseImageKeywordsJSON}}\` and intent \`{{baseImageIntent}}\` is referred to as "圖A" (or "Image A" in English suggestions).
- The image associated with \`{{secondaryImageKeywordsJSON}}\` and intent \`{{secondaryImageIntent}}\` is referred to as "圖B" (or "Image B" in English suggestions).
Please use these explicit labels ("圖A", "圖B", "Image A", "Image B") in your suggested instructions to clearly delineate the roles of the images.

**User's Current Input (Treat as strong guidance if present, otherwise generate fresh ideas):**
- English Instruction: "{{currentUserInstructionEn}}"
- Chinese Instruction: "{{currentUserInstructionZh}}"

**Image Configuration Details:**
**1. 圖A (Base Image):**
   - Purpose/Intent: "{{baseImageIntent}}" (User-selected role, e.g., 參考對象, 圖像合併(1), 風格遷移目標, etc.)
   - Key Visual Elements (from keywords JSON): {{baseImageKeywordsJSON}}

**2. 圖B (Secondary Image, if provided):**
   - Purpose/Intent: "{{secondaryImageIntent}}" (User-selected role)
   - Key Visual Elements (from keywords JSON): {{secondaryImageKeywordsJSON}}

**Your Primary Task:**
Generate 3-5 diverse and actionable prompt suggestions for the main textual instruction. These suggestions should:
1.  **Prioritize Image Intents**: The selected intents for 圖A and 圖B are the MOST IMPORTANT factors. Your suggestions MUST reflect the relationship and operation implied by these intents.
2.  **Incorporate User's Current Input**: If "{{currentUserInstructionEn}}" or "{{currentUserInstructionZh}}" is not empty, your suggestions should build upon, refine, or offer creative alternatives related to this input, while still adhering to the image intents and using "圖A"/"圖B" ("Image A"/"Image B") references. If user input is empty, generate suggestions based purely on intents, keywords, and theme, using the A/B labels.
3.  **Utilize Keywords for Specificity**: Weave relevant keywords from "{{baseImageKeywordsJSON}}" (for 圖A) and "{{secondaryImageKeywordsJSON}}" (for 圖B) into your suggestions to make them precise and grounded in the visual content of the images.
4.  **Maintain Theme Consistency**: Ensure suggestions align with the "{{appContextThemeEn}} / {{appContextThemeZh}}".
5.  **Actionable Language**: Use clear verbs and descriptive terms suitable for an image generation model.

**Guidance for Interpreting Intents (using "圖A" and "圖B"):**
-   **Merging/Combining (e.g., 圖A='圖像合併(1)', 圖B='圖像合併(2)'):** Suggest ways to blend elements from 圖A and 圖B. *Example: "Combine the {{keyword from 圖A}} from 圖A with the {{keyword from 圖B}} from 圖B, set in a {{appContextThemeEn}} environment."*
-   **Style Transfer (e.g., 圖A='content source', 圖B='風格遷移目標'):** Suggest applying the style of 圖B to the content of 圖A. *Example: "Render the {{keyword for subject in 圖A}} from 圖A in the style of {{keywords describing style in 圖B}} from 圖B."*
-   **Object Reference/Replacement (e.g., 圖A='scene', 圖B='參考對象'; or one intent is '物件替換'):** Suggest incorporating an object/characteristic from 圖B into the 圖A scene, or replacing an object in 圖A with one from 圖B. *Example: "In the 圖A scene, replace the existing {{object keyword from 圖A}} with a {{object keyword from 圖B}} from 圖B."*
-   **If user input exists**: Adapt these patterns, incorporating the user's text while maintaining the A/B references.

**Output Requirements (Strict):**
- Return ONLY a valid JSON array of objects.
- Each object MUST have exactly two keys: "suggestionEn" (English) and "suggestionZh" (Traditional Chinese).
- Ensure "Image A"/"Image B" are used for English suggestions and "圖A"/"圖B" for Chinese suggestions.
- No extra text, comments, explanations, or markdown formatting. Pure JSON.
Example:
[
  {"suggestionEn": "Transfer the vibrant, abstract style of Image B (style target) onto the city skyline in Image A (content source).", "suggestionZh": "將 圖B（風格目標）的鮮明抽象風格轉移到 圖A（內容來源）的城市天際線上。"}
]`,
    placeholders: [
      '{{appContextThemeEn}}', '{{appContextThemeZh}}',
      '{{currentUserInstructionEn}}',
      '{{currentUserInstructionZh}}',
      '{{baseImageKeywordsJSON}}',
      '{{baseImageIntent}}',
      '{{secondaryImageKeywordsJSON}}',
      '{{secondaryImageIntent}}',
    ],
  },
  aiGenerateCategoryID: {
    id: 'aiGenerateCategoryID',
    name: 'AI 生成分類 ID',
    description: '根據分類名稱建議一個唯一的英文 ID。',
    template: `You are an AI assistant. Given a category name in Chinese and/or English, generate a unique, concise, lowercase English ID using only letters, numbers, and underscores.
    Existing IDs (do not use these): {{existingCategoryIdsJSON}}
    Category Name (En): "{{categoryNameEn}}"
    Category Name (Zh): "{{categoryNameZh}}"
    Suggested ID:`,
    placeholders: ['{{existingCategoryIdsJSON}}', '{{categoryNameEn}}', '{{categoryNameZh}}'],
  },
  aiCategoryTermSuggestions: {
    id: 'aiCategoryTermSuggestions',
    name: 'AI 分類詞語建議',
    description: '根據分類名稱和主題，為該分類建議5-7個相關提示詞。JSON輸出。',
    template: `You are an expert AI prompt generator for a specific category in an application themed around "{{appContextThemeEn}} / {{appContextThemeZh}}".
Category Name (En): "{{categoryNameEn}}"
Category Name (Zh): "{{categoryNameZh}}"
Application Context/Theme: "{{appContextThemeEn}} / {{appContextThemeZh}}"
Currently Selected Design Style: {{selectedStyleNameEn}} ({{selectedStyleBasePromptEn}}) / {{selectedStyleNameZh}} ({{selectedStyleBasePromptZh}})
Existing terms in this category (JSON format, to avoid duplicates): {{existingTermsJSON}}
Category ID: "{{categoryId}}"

Please suggest 5-7 unique and relevant prompt terms (keywords or short phrases) specifically for the category "{{categoryNameEn}} / {{categoryNameZh}}".
These terms should be highly relevant to the category itself, the application theme "{{appContextThemeEn}} / {{appContextThemeZh}}", and the currently selected design style.
Each term must have an English version and a Traditional Chinese version.
The terms should be directly usable for AI image generation prompts.
Ensure the terms are distinct from any existing terms provided in '{{existingTermsJSON}}'.

Output ONLY a valid JSON array of objects. Each object must have the structure:
{ "id": "unique_term_id_lowercase_underscores", "termEn": "English Term", "termZh": "繁體中文術語", "isCustom": true, "categoryId": "{{categoryId}}" }

Constraints:
- The "id" should be a new, unique, lowercase string using only letters (a-z), numbers (0-9), and underscores (_). Prefer deriving it from the English term where possible (e.g., "dark_wood_grain" for "Dark Wood Grain"). Ensure it does not start or end with an underscore and has no consecutive underscores.
- "isCustom" must always be true.
- "categoryId" must be exactly "{{categoryId}}".
- Do not include any other text, comments, or markdown. Pure JSON array output.
- Ensure termEn and termZh are not empty.
Example for Category "Lighting" (id: "lighting") and Theme "Sci-fi":
[
  { "id": "lighting_holographic_glow", "termEn": "Holographic Glow", "termZh": "全息光輝", "isCustom": true, "categoryId": "lighting" },
  { "id": "lighting_energy_conduits", "termEn": "Visible Energy Conduits", "termZh": "可見能量導管", "isCustom": true, "categoryId": "lighting" }
]
`,
    placeholders: ['{{categoryNameEn}}', '{{categoryNameZh}}', '{{appContextThemeEn}}', '{{appContextThemeZh}}', '{{selectedStyleNameEn}}', '{{selectedStyleBasePromptEn}}', '{{selectedStyleNameZh}}', '{{selectedStyleBasePromptZh}}', '{{existingTermsJSON}}', '{{categoryId}}'],
  },
};
