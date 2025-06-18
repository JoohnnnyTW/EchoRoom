import { UITexts } from '../types';

export const DEFAULT_UI_TEXTS: UITexts = {
  headerTitle: {
    id: 'headerTitle',
    name: '應用程式標頭標題',
    description: '顯示在應用程式頂部的主要標題。',
    textEn: 'EchoRoom',
    textZh: 'EchoRoom',
  },
  styleSelectorTitle: {
    id: 'styleSelectorTitle',
    name: '風格選擇器標題 (非可編輯)',
    description: '設計風格選擇區塊的標題。',
    textEn: 'Design Style',
    textZh: '設計風格',
  },
  roomTypeSelectorTitle: {
    id: 'roomTypeSelectorTitle',
    name: '空間類型選擇器標題',
    description: '空間類型選擇區塊的標題。',
    textEn: 'Room Type',
    textZh: '空間類型',
  },
  roomTypeSetAISuggestionButtonLabel: { 
    id: 'roomTypeSetAISuggestionButtonLabel',
    name: '空間類型AI建議按鈕標籤',
    description: '在空間類型選擇器中，AI建議新空間組合的按鈕標籤。',
    textEn: 'AI Suggest New Room/Area Type',
    textZh: 'AI 新增空間/區域建議',
  },
  subjectInputTitle: {
    id: 'subjectInputTitle',
    name: '主體內容輸入標題',
    description: '輸入圖像主要描述內容區塊的標題。',
    textEn: 'Subject / Main Content',
    textZh: '主體內容描述',
  },
  imageAnalyzerTitle: { 
    id: 'imageAnalyzerTitle',
    name: '圖像分析器標題',
    description: '上傳圖片並透過 AI 分析產生提示詞區塊的標題。',
    textEn: 'Image-based Prompt Generation',
    textZh: '圖像分析與提示詞生成',
  },
  analyzeImageButton: { 
    id: 'analyzeImageButton',
    name: '分析圖像按鈕文字',
    description: '點擊以使用 AI 分析上傳圖片的按鈕文字。',
    textEn: 'Analyze Image with AI',
    textZh: '使用 AI 分析圖像',
  },
  uploadImageLabel: { 
    id: 'uploadImageLabel',
    name: '上傳圖片標籤文字',
    description: '圖片上傳輸入框的標籤文字。',
    textEn: 'Upload Image:',
    textZh: '上傳圖片：',
  },
  promptCategoriesMainTitle: {
    id: 'promptCategoriesMainTitle',
    name: '提示詞分類主標題 (非可編輯)',
    description: '提示詞分類列表上方的整體標題。',
    textEn: 'Prompt Categories',
    textZh: '提示詞分類',
  },
  promptBuilderTitle: {
    id: 'promptBuilderTitle',
    name: '提示詞建構器標題 (非可編輯)',
    description: '顯示已選提示詞及最終生成提示詞的區塊標題。',
    textEn: 'Selected Prompts',
    textZh: '已選提示詞',
  },
  imageGeneratorTitle: {
    id: 'imageGeneratorTitle',
    name: '圖像生成器標題 (非可編輯)',
    description: 'AI 圖像生成控制區塊的標題。',
    textEn: 'AI Image Generation',
    textZh: 'AI 圖像生成',
  },
  imageHistoryDisplayTitle: {
    id: 'imageHistoryDisplayTitle',
    name: '圖像歷史記錄標題 (非可編輯)',
    description: '顯示生成圖像歷史的區塊標題。',
    textEn: 'Image Generation History',
    textZh: '圖像生成歷史',
  },
  settingsModalTitle: {
    id: 'settingsModalTitle',
    name: '設定彈窗標題 (非可編輯)',
    description: '應用程式設定彈窗的主標題。',
    textEn: 'Application Settings',
    textZh: '應用程式設定',
  },
  addStyleModalTitle: {
    id: 'addStyleModalTitle',
    name: '新增風格彈窗標題 (非可編輯)',
    description: '新增自訂設計風格彈窗的標題。',
    textEn: 'Add Custom Design Style',
    textZh: '新增自訂設計風格',
  },
  addRoomTypeModalTitle: { 
    id: 'addRoomTypeModalTitle',
    name: '新增空間類型彈窗標題 (非可編輯)',
    description: '新增自訂空間類型彈窗的標題。',
    textEn: 'Add Custom Room Type',
    textZh: '新增自訂空間類型',
  },
  addCustomTermModalTitle: { // Used when adding from category accordion
    id: 'addCustomTermModalTitle',
    name: '新增自訂詞語彈窗標題 (分類用)',
    description: '從提示詞分類區塊中新增自訂詞語的彈窗標題。{categoryName} 會被替換。',
    textEn: 'Add Custom Term to "{categoryName}"',
    textZh: '新增自訂詞語到「{categoryName}」',
  },
  addCustomTermModalQuickAddTitle: { 
    id: 'addCustomTermModalQuickAddTitle',
    name: '新增自訂詞語彈窗標題 (快速新增用)',
    description: '從「已選提示詞」區塊中快速新增自訂詞語的彈窗標題。',
    textEn: 'Quick Add New Custom Term',
    textZh: '快速新增自訂詞語',
  },
  saveTermToCategoryModalTitle: { 
    id: 'saveTermToCategoryModalTitle',
    name: '儲存詞語到分類彈窗標題',
    description: '將「已選提示詞」中的現有詞語儲存為自訂詞語到特定分類的彈窗標題。',
    textEn: 'Save Term to Category',
    textZh: '儲存詞語到分類',
  },
  saveTermToCategoryButtonTitle: {
    id: 'saveTermToCategoryButtonTitle',
    name: '儲存詞語到分類按鈕提示文字',
    description: '在「已選提示詞」區塊中，每個詞語旁「儲存到分類」按鈕的提示文字。',
    textEn: 'Save this term to a category (makes it custom)',
    textZh: '儲存此詞語到分類 (設為自訂)',
  },
  chipSaveTermButtonLabel: { 
    id: 'chipSaveTermButtonLabel',
    name: '詞語晶片儲存按鈕文字',
    description: '在「已選提示詞」晶片上，用於儲存未分類詞語的按鈕顯示文字。',
    textEn: 'Save',
    textZh: '儲存',
  },
  chipCopyToQuickAddButtonTitle: { 
    id: 'chipCopyToQuickAddButtonTitle',
    name: '詞語晶片複製到快速新增按鈕提示文字',
    description: '在「已選提示詞」晶片上，用於將詞語複製到快速新增欄位的按鈕提示文字。',
    textEn: 'Copy to Quick Add fields',
    textZh: '複製到快速新增欄位',
  },
  aiSuggestionsModalTitle: {
    id: 'aiSuggestionsModalTitle',
    name: 'AI 建議彈窗標題 (非可編輯)',
    description: 'AI 提示詞建議彈窗的標題。',
    textEn: 'AI Prompt Suggestions',
    textZh: 'AI 關鍵詞建議',
  },
   imageDetailModalTitle: {
    id: 'imageDetailModalTitle',
    name: '圖像詳細資訊彈窗標題 (非可編輯)',
    description: '顯示單個圖像詳細資訊的彈窗標題。',
    textEn: 'Image Details',
    textZh: '圖像詳情',
  },
  styleEditorFurnitureBrandsLabel: {
    id: 'styleEditorFurnitureBrandsLabel',
    name: '風格編輯器 - 家具品牌標籤 (非直接編輯)',
    description: '在風格編輯器中，「建議家具品牌」區塊的標籤。',
    textEn: 'Suggested Furniture/Brands',
    textZh: '建議家具/品牌',
  },
  styleEditorDecorTipsLabel: {
    id: 'styleEditorDecorTipsLabel',
    name: '風格編輯器 - 佈置技巧標籤 (非直接編輯)',
    description: '在風格編輯器中，「佈置技巧」區塊的標籤。',
    textEn: 'Decor Tips',
    textZh: '佈置技巧',
  },
  clearHistoryButtonLabel: {
    id: 'clearHistoryButtonLabel',
    name: '清除歷史按鈕標籤',
    description: '清除圖像生成歷史記錄按鈕的文字。',
    textEn: 'Clear History',
    textZh: '清除全部歷史',
  },
  clearHistoryButtonTooltip: {
    id: 'clearHistoryButtonTooltip',
    name: '清除歷史按鈕提示',
    description: '清除圖像生成歷史記錄按鈕的鼠標懸停提示文字。',
    textEn: 'Clear all image generation history',
    textZh: '清除所有圖像生成歷史記錄',
  },
  favoriteImageButtonTooltip: {
    id: 'favoriteImageButtonTooltip',
    name: '收藏圖像按鈕提示',
    description: '將圖像標記為收藏的按鈕鼠標懸停提示文字。',
    textEn: 'Favorite this image',
    textZh: '收藏此圖像',
  },
  unfavoriteImageButtonTooltip: {
    id: 'unfavoriteImageButtonTooltip',
    name: '取消收藏圖像按鈕提示',
    description: '從收藏中移除圖像的按鈕鼠標懸停提示文字。',
    textEn: 'Unfavorite this image',
    textZh: '取消收藏此圖像',
  },
  viewFavoritesButtonLabel: {
    id: 'viewFavoritesButtonLabel',
    name: '查看收藏按鈕標籤',
    description: '用於導航到收藏圖像頁面的按鈕文字。',
    textEn: 'My Favorites',
    textZh: '我的收藏',
  },
  favoritesPageTitle: {
    id: 'favoritesPageTitle',
    name: '收藏頁面標題',
    description: '「我的收藏」頁面的主標題。',
    textEn: 'My Favorite Images',
    textZh: '我的收藏圖像',
  },
  backToMainAppButtonLabel: {
    id: 'backToMainAppButtonLabel',
    name: '返回主應用按鈕標籤',
    description: '從收藏頁面返回主應用程式界面的按鈕文字。',
    textEn: 'Back to Main App',
    textZh: '返回主應用程式',
  },
  multimodalEditModalTitle: {
    id: 'multimodalEditModalTitle',
    name: '多模態編輯彈窗標題',
    description: '使用AI編輯圖像的彈窗標題。',
    textEn: 'Edit Image with AI',
    textZh: '進階 AI 圖像編輯',
  },
  imageAnalyzerEditButtonLabel: { 
    id: 'imageAnalyzerEditButtonLabel',
    name: '圖像分析器 - 編輯按鈕標籤 (舊)',
    description: '在圖像分析器中，用於開啟圖像編輯模態框的按鈕文字。(可能已棄用)',
    textEn: 'Edit Image with AI (Old)',
    textZh: '用 AI 編輯此圖像 (舊)',
  },
  imageAnalyzerAdvancedEditButtonLabel: { 
    id: 'imageAnalyzerAdvancedEditButtonLabel',
    name: '圖像分析器 - 進階編輯按鈕',
    description: '在圖像分析器中，開啟進階AI圖像編輯功能的按鈕文字。',
    textEn: 'Advanced AI Image Edit',
    textZh: '進階 AI 圖像編輯',
  },
  imageAnalyzerOpenFusionStudioButtonLabel: { 
    id: 'imageAnalyzerOpenFusionStudioButtonLabel',
    name: '圖像分析器 - 開啟融合工作室按鈕',
    description: '在圖像分析器中，開啟圖像融合工作室的按鈕文字。',
    textEn: 'Open Image Fusion Studio',
    textZh: '開啟圖像融合工作室',
  },
  subjectInputAISuggestionButtonLabel: {
    id: 'subjectInputAISuggestionButtonLabel',
    name: '主體內容AI建議按鈕標籤',
    description: '在主體內容輸入區塊，獲取AI建議的按鈕文字。',
    textEn: 'AI Suggest Subject',
    textZh: 'AI 建議主體內容',
  },
  multimodalEditAISuggestionButtonLabel: {
    id: 'multimodalEditAISuggestionButtonLabel',
    name: '圖像編輯AI建議按鈕標籤',
    description: '在圖像編輯彈窗，獲取AI編輯指令建議的按鈕文字。',
    textEn: 'AI Suggest Edit Instruction',
    textZh: 'AI 建議編輯指令',
  },
  multimodalEditUseResultButtonLabel: {
    id: 'multimodalEditUseResultButtonLabel',
    name: '圖像編輯 - 使用結果按鈕標籤',
    description: '在圖像編輯彈窗中，使用剛生成的結果作為下一次編輯的基礎圖像的按鈕文字。',
    textEn: 'Use this result for further editing',
    textZh: '用此結果繼續編輯',
  },
  multimodalEditChineseInstructionLabel: { 
    id: 'multimodalEditChineseInstructionLabel',
    name: '圖像編輯 - 中文指令標籤',
    description: '在圖像編輯彈窗中，中文編輯指令輸入框的標籤。',
    textEn: 'Chinese Edit Instruction',
    textZh: '中文編輯指令',
  },
  multimodalEditEnglishInstructionLabel: { 
    id: 'multimodalEditEnglishInstructionLabel',
    name: '圖像編輯 - 英文指令標籤',
    description: '在圖像編輯彈窗中，英文編輯指令輸入框的標籤。',
    textEn: 'English Edit Instruction',
    textZh: '英文編輯指令',
  },
  multimodalEditTranslateToEnButtonLabel: { 
    id: 'multimodalEditTranslateToEnButtonLabel',
    name: '圖像編輯 - 譯為英文按鈕標籤',
    description: '在圖像編輯彈窗中，將中文指令翻譯為英文的按鈕文字。',
    textEn: 'To English',
    textZh: '譯為英文',
  },
  multimodalEditTranslateToZhButtonLabel: { 
    id: 'multimodalEditTranslateToZhButtonLabel',
    name: '圖像編輯 - 譯為中文按鈕標籤',
    description: '在圖像編輯彈窗中，將英文指令翻譯為中文的按鈕文字。',
    textEn: 'To Chinese',
    textZh: '譯為中文',
  },
  imageFusionStudioModalTitle: {
    id: 'imageFusionStudioModalTitle',
    name: '圖像融合工作室彈窗標題',
    description: '圖像融合、風格轉換等高級編輯功能的彈窗標題。',
    textEn: 'Image Fusion Studio',
    textZh: '圖像融合工作室',
  },
  imageFusionStudioUploadSecondaryButtonLabel: {
    id: 'imageFusionStudioUploadSecondaryButtonLabel',
    name: '圖像融合 - 上傳次要圖片按鈕',
    description: '在圖像融合工作室中，上傳第二張參與運算圖片的按鈕文字。',
    textEn: 'Upload Image',
    textZh: '上傳圖片',
  },
  imageFusionStudioUsageIntentLabel: {
    id: 'imageFusionStudioUsageIntentLabel',
    name: '圖像融合 - 用途意圖標籤',
    description: '在圖像融合工作室中，選擇圖片用途（如風格參考、合併對象等）的下拉選單標籤。',
    textEn: 'Usage Intent',
    textZh: '圖像用途意圖',
  },
  imageFusionStudioGenerateButtonLabel: {
    id: 'imageFusionStudioGenerateButtonLabel',
    name: '圖像融合 - 生成按鈕',
    description: '在圖像融合工作室中，開始生成結果圖像的按鈕文字。',
    textEn: 'Generate Fused/Styled Image',
    textZh: '生成融合/風格化圖像',
  },
  imageFusionStudioUseResultButtonLabel: {
    id: 'imageFusionStudioUseResultButtonLabel',
    name: '圖像融合 - 使用結果按鈕',
    description: '在圖像融合工作室中，將剛生成的結果設為新的基礎圖像以進行進一步編輯的按鈕文字。',
    textEn: 'Use Result for Further Fusion',
    textZh: '以此結果繼續融合編輯',
  },
  imageFusionStudioAISuggestionButtonLabel: {
    id: 'imageFusionStudioAISuggestionButtonLabel',
    name: '圖像融合 - AI建議按鈕',
    description: '在圖像融合工作室中，獲取AI對主要編輯指令的建議按鈕文字。',
    textEn: 'AI Suggest Instructions',
    textZh: 'AI 建議編輯指令',
  },
  imageFusionStudioOpenButtonTooltip: {
    id: 'imageFusionStudioOpenButtonTooltip',
    name: '圖像融合 - 開啟按鈕提示',
    description: '在圖像歷史記錄中，用於開啟圖像融合工作室的按鈕提示文字。',
    textEn: 'Open in Image Fusion Studio (Advanced Edit)',
    textZh: '在圖像融合工作室中開啟 (進階編輯)',
  },
  imageFusionStudioSwapInstructionsButtonTooltip: { 
    id: 'imageFusionStudioSwapInstructionsButtonTooltip',
    name: '圖像融合 - 對調指令A/B參考按鈕提示',
    description: '在圖像融合工作室的主要指令區，用於對調指令文字中A圖B圖參考的按鈕提示文字。',
    textEn: 'Swap Image A/B references in instructions',
    textZh: '對調指令中的A圖/B圖參考',
  },
  imageFusionStudioImportFromGalleryButtonLabel: { 
    id: 'imageFusionStudioImportFromGalleryButtonLabel',
    name: '圖像融合 - 從圖庫導入按鈕',
    description: '在圖像融合工作室中，用於從已生成/收藏圖庫導入圖像的按鈕文字。',
    textEn: 'Import from Gallery',
    textZh: '從圖庫導入',
  },
  // New UI Texts for ImageFusionStudioModal instruction inputs
  imageFusionStudioChineseInstructionLabel: {
    id: 'imageFusionStudioChineseInstructionLabel',
    name: '圖像融合 - 中文指令標籤',
    description: '在圖像融合工作室中，中文主要編輯指令輸入框的標籤。',
    textEn: 'Main Chinese Instruction',
    textZh: '主要中文指令',
  },
  imageFusionStudioEnglishInstructionLabel: {
    id: 'imageFusionStudioEnglishInstructionLabel',
    name: '圖像融合 - 英文指令標籤',
    description: '在圖像融合工作室中，英文主要編輯指令輸入框的標籤。',
    textEn: 'Main English Instruction (for generation)',
    textZh: '主要英文指令 (用於生成)',
  },
  imageFusionStudioTranslateToEnButtonLabel: {
    id: 'imageFusionStudioTranslateToEnButtonLabel',
    name: '圖像融合 - 譯為英文按鈕標籤',
    description: '在圖像融合工作室中，將中文主要指令翻譯為英文的按鈕文字。',
    textEn: 'Translate to English',
    textZh: '譯為英文',
  },
  imageFusionStudioTranslateToZhButtonLabel: {
    id: 'imageFusionStudioTranslateToZhButtonLabel',
    name: '圖像融合 - 譯為中文按鈕標籤',
    description: '在圖像融合工作室中，將英文主要指令翻譯為中文的按鈕文字。',
    textEn: 'Translate to Chinese',
    textZh: '譯為中文',
  },
  imageSelectorModalTitle: { 
    id: 'imageSelectorModalTitle',
    name: '圖像選擇器彈窗標題',
    description: '選擇已生成或收藏圖像以導入的彈窗標題。',
    textEn: 'Select Image from Gallery',
    textZh: '從圖庫選擇圖像',
  },
  imageSelectorModalAllTab: { 
    id: 'imageSelectorModalAllTab',
    name: '圖像選擇器 - 全部頁籤',
    description: '在圖像選擇器彈窗中，「全部已生成」頁籤的標籤。',
    textEn: 'All Generated',
    textZh: '全部已生成',
  },
  imageSelectorModalFavoritesTab: { 
    id: 'imageSelectorModalFavoritesTab',
    name: '圖像選擇器 - 收藏頁籤',
    description: '在圖像選擇器彈窗中，「我的收藏」頁籤的標籤。',
    textEn: 'My Favorites',
    textZh: '我的收藏',
  },
  imageSelectorModalNoImages: { 
    id: 'imageSelectorModalNoImages',
    name: '圖像選擇器 - 無圖像訊息',
    description: '當「全部已生成」圖庫為空時顯示的訊息。',
    textEn: 'No images generated yet.',
    textZh: '尚無已生成的圖像。',
  },
  imageSelectorModalNoFavorites: { 
    id: 'imageSelectorModalNoFavorites',
    name: '圖像選擇器 - 無收藏訊息',
    description: '當「我的收藏」圖庫為空時顯示的訊息。',
    textEn: 'No favorite images found.',
    textZh: '找不到收藏的圖像。',
  },
  // Cached Profiles
  settingsModalLocalProfilesTabTitle: {
    id: 'settingsModalLocalProfilesTabTitle', name: '設定彈窗 - 本機設定檔頁籤標題',
    description: '在設定彈窗中，用於管理本機快取設定檔的頁籤標題。',
    textEn: 'Local Profiles', textZh: '設定檔快取'
  },
  cachedProfileCardTitle: {
    id: 'cachedProfileCardTitle', name: '設定檔卡片標題',
    description: '顯示已儲存設定檔的卡片標題（通常為設定檔名稱）。{profileName} 會被替換。',
    textEn: 'Profile: {profileName}', textZh: '設定檔：{profileName}'
  },
  cachedProfileNameInputLabel: {
    id: 'cachedProfileNameInputLabel', name: '設定檔名稱輸入框標籤',
    description: '儲存新設定檔時，名稱輸入框的標籤。',
    textEn: 'Profile Name', textZh: '設定檔名稱'
  },
   cachedProfileNameInputPlaceholder: {
    id: 'cachedProfileNameInputPlaceholder', name: '設定檔名稱輸入框預留文字',
    description: '設定檔名稱輸入框中的預留提示文字。',
    textEn: 'Enter a name for this profile...', textZh: '為此設定檔輸入一個名稱...'
  },
  cachedProfileUploadThumbnailButtonLabel: {
    id: 'cachedProfileUploadThumbnailButtonLabel', name: '上傳縮圖按鈕標籤',
    description: '為設定檔卡片上傳代表性縮圖的按鈕標籤。',
    textEn: 'Upload Thumbnail', textZh: '上傳代表圖'
  },
  cachedProfileSelectThumbnailButtonLabel: {
    id: 'cachedProfileSelectThumbnailButtonLabel', name: '從圖庫選擇縮圖按鈕標籤',
    description: '從已生成圖像歷史中選擇代表性縮圖的按鈕標籤。',
    textEn: 'Select from Gallery', textZh: '從圖庫選擇代表圖'
  },
  cachedProfileSaveButtonLabel: {
    id: 'cachedProfileSaveButtonLabel', name: '儲存設定檔按鈕標籤',
    description: '將目前設定儲存為一個新的本機快取設定檔的按鈕標籤。',
    textEn: 'Save Current Settings to Local Cache', textZh: '儲存目前設定至本機快取'
  },
  cachedProfileLoadButtonLabel: {
    id: 'cachedProfileLoadButtonLabel', name: '載入設定檔按鈕標籤',
    description: '載入已儲存設定檔的按鈕標籤。',
    textEn: 'Load Profile', textZh: '載入此設定檔'
  },
  cachedProfileDeleteButtonLabel: {
    id: 'cachedProfileDeleteButtonLabel', name: '刪除設定檔按鈕標籤',
    description: '刪除已儲存設定檔的按鈕標籤。',
    textEn: 'Delete Profile', textZh: '刪除此設定檔'
  },
  cachedProfileEditNameButtonLabel: {
    id: 'cachedProfileEditNameButtonLabel', name: '編輯設定檔名稱按鈕標籤',
    description: '編輯已儲存設定檔名稱的按鈕標籤。',
    textEn: 'Edit Name', textZh: '編輯名稱'
  },
  cachedProfileChangeThumbnailButtonLabel: {
    id: 'cachedProfileChangeThumbnailButtonLabel', name: '更換設定檔縮圖按鈕標籤',
    description: '為已儲存設定檔更換縮圖的按鈕標籤。',
    textEn: 'Change Thumbnail', textZh: '更換代表圖'
  },
  cachedProfileConfirmDeleteTitle: {
    id: 'cachedProfileConfirmDeleteTitle', name: '確認刪除設定檔標題',
    description: '刪除設定檔時確認對話框的標題。',
    textEn: 'Confirm Delete Profile', textZh: '確認刪除設定檔'
  },
  cachedProfileConfirmDeleteMessage: {
    id: 'cachedProfileConfirmDeleteMessage', name: '確認刪除設定檔訊息',
    description: '刪除設定檔時確認對話框的訊息內容。{profileName} 將被替換。',
    textEn: 'Are you sure you want to delete the profile "{profileName}"? This action cannot be undone.',
    textZh: '您確定要刪除設定檔「{profileName}」嗎？此操作無法復原。'
  },
  cachedProfileLoadSuccessMessage: {
    id: 'cachedProfileLoadSuccessMessage', name: '載入設定檔成功訊息',
    description: '成功載入設定檔後顯示的訊息。{profileName} 將被替換。',
    textEn: 'Profile "{profileName}" loaded. Review and save global settings if desired.',
    textZh: '設定檔「{profileName}」已載入。請檢閱並視需要儲存全域設定。'
  },
  cachedProfileSaveSuccessMessage: {
    id: 'cachedProfileSaveSuccessMessage', name: '儲存設定檔成功訊息',
    description: '成功儲存設定檔後顯示的訊息。{profileName} 將被替換。',
    textEn: 'Profile "{profileName}" saved successfully.',
    textZh: '設定檔「{profileName}」已成功儲存。'
  },
  cachedProfileDeleteSuccessMessage: {
    id: 'cachedProfileDeleteSuccessMessage', name: '刪除設定檔成功訊息',
    description: '成功刪除設定檔後顯示的訊息。{profileName} 將被替換。',
    textEn: 'Profile "{profileName}" deleted successfully.',
    textZh: '設定檔「{profileName}」已成功刪除。'
  },
  cachedProfileEditNamePrompt: {
    id: 'cachedProfileEditNamePrompt', name: '編輯設定檔名稱提示',
    description: '編輯設定檔名稱時，輸入新名稱的提示訊息。{profileName} 將被替換。',
    textEn: 'Enter new name for profile "{profileName}":',
    textZh: '請為設定檔「{profileName}」輸入新名稱：'
  },
  cachedProfileThumbnailLabel: {
    id: 'cachedProfileThumbnailLabel', name: '設定檔縮圖標籤',
    description: '在設定檔儲存區域，縮圖預覽上方的標籤。',
    textEn: 'Profile Thumbnail', textZh: '設定檔代表圖'
  },
  thumbnailSelectorModalTitleLabel: {
    id: 'thumbnailSelectorModalTitleLabel', name: '縮圖選擇器彈窗標題',
    description: '從圖庫選擇設定檔縮圖的彈窗標題。',
    textEn: 'Select Thumbnail from Image History', textZh: '從圖像歷史選擇代表圖'
  },
  subjectPhraseSuggestionsModalTitle: { 
    id: 'subjectPhraseSuggestionsModalTitle',
    name: 'AI 主體內容建議彈窗標題',
    description: 'AI 基於種子文字提供主體內容建議的彈窗標題。',
    textEn: 'AI Subject Content Suggestions',
    textZh: 'AI 主體內容建議',
  },
  cachedProfileClearCacheButtonLabel: { 
    id: 'cachedProfileClearCacheButtonLabel', name: '清除設定檔快取按鈕標籤',
    description: '清除所有本機快取設定檔的按鈕文字。',
    textEn: 'Clear All Cached Profiles', textZh: '清除所有設定檔快取'
  },
  cachedProfileConfirmClearCacheMessage: { 
    id: 'cachedProfileConfirmClearCacheMessage', name: '確認清除設定檔快取訊息',
    description: '點擊「清除所有設定檔快取」按鈕後，確認對話框中顯示的警告訊息。',
    textEn: 'Are you sure you want to delete ALL cached profiles? This action cannot be undone and will remove all saved setting configurations.',
    textZh: '您確定要刪除所有本機快取的設定檔嗎？此操作無法復原，將會移除所有已儲存的設定組態。'
  },
  cachedProfileClearCacheSuccessMessage: { 
    id: 'cachedProfileClearCacheSuccessMessage', name: '清除設定檔快取成功訊息',
    description: '成功清除所有本機快取設定檔後顯示的訊息。',
    textEn: 'All cached profiles have been deleted.', textZh: '所有設定檔快取已成功刪除。'
  },
  addCategoryModalTitle: {
    id: 'addCategoryModalTitle',
    name: '新增分類彈窗標題',
    description: '用於新增提示詞分類的彈窗標題。',
    textEn: 'Add New Prompt Category',
    textZh: '新增提示詞分類',
  },
  aiSuggestedCategoryTermsModalTitle: {
    id: 'aiSuggestedCategoryTermsModalTitle',
    name: 'AI 建議分類詞語彈窗標題',
    description: 'AI 為特定分類建議詞語的彈窗標題。{categoryName} 會被替換。',
    textEn: 'AI Suggested Terms for "{categoryName}"',
    textZh: 'AI 為「{categoryName}」建議的詞語',
  },
};
