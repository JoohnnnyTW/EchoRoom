
import { DesignStyle, PromptTerm, DynamicDetailSet } from '../types'; 
import { ensureThreeTerms } from '../utils/arrayUtils'; // Import shared utility

export const ROOM_TYPES: PromptTerm[] = [ 
  { id: 'room_living', termEn: 'living room', termZh: '客廳' },
  { id: 'room_bedroom', termEn: 'bedroom', termZh: '臥室' },
  { id: 'room_kitchen', termEn: 'kitchen', termZh: '廚房' },
  { id: 'room_dining', termEn: 'dining room', termZh: '餐廳' },
  { id: 'room_bathroom', termEn: 'bathroom', termZh: '浴室' },
  { id: 'room_office', termEn: 'home office', termZh: '家庭辦公室' },
  { id: 'room_kids', termEn: 'kids room', termZh: '兒童房' },
  { id: 'room_entryway', termEn: 'entryway', termZh: '玄關' },
];

export const FURNITURE_TERMS: PromptTerm[] = [ 
  { id: 'furn_sofa_sectional', termEn: 'sectional sofa', termZh: '模組沙發' },
  { id: 'furn_sofa_chesterfield', termEn: 'chesterfield sofa', termZh: '徹斯特菲爾德沙發' },
  { id: 'furn_armchair_accent', termEn: 'accent armchair', termZh: '特色扶手椅' },
  { id: 'furn_armchair_lounge', termEn: 'lounge chair', termZh: '休閒椅' },
  { id: 'furn_coffee_table_wood', termEn: 'wooden coffee table', termZh: '木製咖啡桌' },
  { id: 'furn_coffee_table_glass', termEn: 'glass coffee table', termZh: '玻璃咖啡桌' },
  { id: 'furn_side_table_marble', termEn: 'marble side table', termZh: '大理石邊桌' },
  { id: 'furn_dining_table_round', termEn: 'round dining table', termZh: '圓形餐桌' },
  { id: 'furn_dining_chairs_upholstered', termEn: 'upholstered dining chairs', termZh: '軟包餐椅' },
  { id: 'furn_bed_platform', termEn: 'platform bed', termZh: '平台床' },
  { id: 'furn_bed_canopy', termEn: 'canopy bed', termZh: '四柱床' },
  { id: 'furn_nightstand_floating', termEn: 'floating nightstand', termZh: '懸浮床頭櫃' },
  { id: 'furn_dresser_drawers', termEn: 'dresser with drawers', termZh: '抽屜梳妝台' },
  { id: 'furn_desk_minimalist', termEn: 'minimalist desk', termZh: '極簡書桌' },
  { id: 'furn_office_chair_ergonomic', termEn: 'ergonomic office chair', termZh: '人體工學辦公椅' },
  { id: 'furn_bookshelf_tall', termEn: 'tall bookshelf', termZh: '高書架' },
  { id: 'furn_bookshelf_ladder', termEn: 'ladder bookshelf', termZh: '梯形書架' },
  { id: 'furn_ottoman_storage', termEn: 'storage ottoman', termZh: '儲物腳凳' },
  { id: 'furn_bench_entryway', termEn: 'entryway bench', termZh: '玄關長凳' },
  { id: 'furn_bar_stools', termEn: 'bar stools', termZh: '吧台凳' },
];

// Local interface for the structure of items in PROMPT_CATEGORIES
export interface PromptCategoryDefinition {
  id: string;
  nameEn: string;
  nameZh: string;
  isOpen: boolean; // Corresponds to CustomPromptCategorySetting.isOpenDefault
  terms: PromptTerm[];
}

export const PROMPT_CATEGORIES: PromptCategoryDefinition[] = [
  {
    id: 'materials',
    nameEn: 'Materials',
    nameZh: '材質表現',
    isOpen: true,
    terms: [
      { id: 'mat_wood_oak', termEn: 'oak wood', termZh: '橡木' },
      { id: 'mat_wood_walnut', termEn: 'walnut wood', termZh: '胡桃木' },
      { id: 'mat_wood_pine', termEn: 'pine wood', termZh: '松木' },
      { id: 'mat_wood_light', termEn: 'light wood', termZh: '淺色木材' },
      { id: 'mat_wood_dark', termEn: 'dark wood', termZh: '深色木材' },
      { id: 'mat_stone_marble', termEn: 'marble', termZh: '大理石' },
      { id: 'mat_stone_granite', termEn: 'granite', termZh: '花崗岩' },
      { id: 'mat_concrete', termEn: 'polished concrete', termZh: '拋光混凝土' },
      { id: 'mat_metal_steel', termEn: 'stainless steel', termZh: '不銹鋼' },
      { id: 'mat_metal_brass', termEn: 'brass accents', termZh: '黃銅裝飾' },
      { id: 'mat_metal_black', termEn: 'blackened metal', termZh: '黑色金屬' },
      { id: 'mat_fabric_linen', termEn: 'linen fabric', termZh: '亞麻布料' },
      { id: 'mat_fabric_velvet', termEn: 'velvet upholstery', termZh: '天鵝絨軟包' },
      { id: 'mat_fabric_cotton', termEn: 'cotton textiles', termZh: '棉紡織品' },
      { id: 'mat_leather', termEn: 'leather', termZh: '皮革' },
      { id: 'mat_glass', termEn: 'glass partitions', termZh: '玻璃隔間' },
      { id: 'mat_brick', termEn: 'exposed brick wall', termZh: '裸露磚牆' },
    ].map(term => ({ ...term, isCustom: false })), // Ensure isCustom is set
  },
  {
    id: 'furniture',
    nameEn: 'Furniture Pieces',
    nameZh: '家具單品',
    isOpen: false,
    terms: FURNITURE_TERMS.map(term => ({ ...term, isCustom: false })),
  },
  {
    id: 'cabinetry',
    nameEn: 'System Cabinets / Custom Furniture',
    nameZh: '系統櫃 / 客製化家具',
    isOpen: false,
    terms: [
      { id: 'cab_full_height', termEn: 'full-height cabinets', termZh: '通頂櫃' },
      { id: 'cab_floating', termEn: 'floating shelves', termZh: '懸浮層架' },
      { id: 'cab_open_shelving', termEn: 'open shelving system', termZh: '開放式層架系統' },
      { id: 'cab_minimalist_handleless', termEn: 'minimalist handleless cabinets', termZh: '極簡無把手櫥櫃' },
      { id: 'cab_integrated_lighting', termEn: 'cabinets with integrated lighting', termZh: '帶整合照明的櫥櫃' },
      { id: 'cab_tv_unit', termEn: 'custom TV unit', termZh: '客製化電視櫃' },
      { id: 'cab_wardrobe', termEn: 'built-in wardrobe', termZh: '嵌入式衣櫃' },
      { id: 'cab_kitchen_island', termEn: 'kitchen island with storage', termZh: '帶儲物功能廚房中島' },
    ].map(term => ({ ...term, isCustom: false })),
  },
  {
    id: 'photography',
    nameEn: 'Photography & Composition',
    nameZh: '攝影方法與構圖',
    isOpen: false,
    terms: [
      { id: 'photo_wide_angle', termEn: 'wide-angle shot', termZh: '廣角鏡頭' },
      { id: 'photo_eye_level', termEn: 'eye-level shot', termZh: '水平視角鏡頭' },
      { id: 'photo_high_angle', termEn: 'high-angle shot', termZh: '俯視鏡頭' },
      { id: 'photo_low_angle', termEn: 'low-angle shot', termZh: '仰視鏡頭' },
      { id: 'photo_detail_shot', termEn: 'detail shot', termZh: '特寫鏡頭' },
      { id: 'photo_long_shot', termEn: 'long shot', termZh: '遠景鏡頭' },
      { id: 'photo_rule_of_thirds', termEn: 'rule of thirds composition', termZh: '三分法構圖' },
      { id: 'photo_leading_lines', termEn: 'leading lines', termZh: '引導線構圖' },
      { id: 'photo_depth_of_field', termEn: 'shallow depth of field', termZh: '淺景深' },
      { id: 'photo_cinematic', termEn: 'cinematic still', termZh: '電影感靜態畫面' },
      { id: 'photo_architectural', termEn: 'architectural photography style', termZh: '建築攝影風格' },
    ].map(term => ({ ...term, isCustom: false })),
  },
  {
    id: 'human_presence',
    nameEn: 'Human Presence & Atmosphere',
    nameZh: '人物情境與氛圍',
    isOpen: false,
    terms: [
      { id: 'human_none', termEn: 'unoccupied', termZh: '無人' },
      { id: 'human_reading', termEn: 'person reading peacefully', termZh: '一人安靜閱讀' },
      { id: 'human_relaxing', termEn: 'people relaxing', termZh: '人們放鬆休憩' },
      { id: 'human_working', termEn: 'person working at a desk', termZh: '一人在書桌工作' },
      { id: 'human_cooking', termEn: 'person cooking in kitchen', termZh: '一人在廚房烹飪' },
      { id: 'human_silhouette', termEn: 'silhouette of a person', termZh: '人物剪影' },
      { id: 'atmos_cozy', termEn: 'cozy atmosphere', termZh: '舒適氛圍' },
      { id: 'atmos_serene', termEn: 'serene atmosphere', termZh: '寧靜氛圍' },
      { id: 'atmos_vibrant', termEn: 'vibrant atmosphere', termZh: '活力氛圍' },
      { id: 'atmos_moody', termEn: 'moody atmosphere', termZh: '情調氛圍' },
    ].map(term => ({ ...term, isCustom: false })),
  },
  {
    id: 'lighting',
    nameEn: 'Lighting & Shadow',
    nameZh: '光影與室內燈光',
    isOpen: false,
    terms: [
      { id: 'light_natural', termEn: 'bright natural light', termZh: '明亮自然光' },
      { id: 'light_sunlight_direct', termEn: 'direct sunlight streaming in', termZh: '陽光直射灑入' },
      { id: 'light_soft_diffused', termEn: 'soft diffused light', termZh: '柔和漫射光' },
      { id: 'light_golden_hour', termEn: 'golden hour lighting', termZh: '黃金時刻光線' },
      { id: 'light_warm_ambient', termEn: 'warm ambient lighting', termZh: '暖色氛圍燈光' },
      { id: 'light_cool_toned', termEn: 'cool-toned lighting', termZh: '冷色調燈光' },
      { id: 'light_dramatic_shadows', termEn: 'dramatic shadows', termZh: '戲劇性陰影' },
      { id: 'light_spotlights', termEn: 'spotlights highlighting features', termZh: '聚光燈突顯特色' },
      { id: 'light_pendant', termEn: 'statement pendant light', termZh: '個性吊燈' },
      { id: 'light_hidden_led', termEn: 'hidden LED strip lighting', termZh: '隱藏式LED燈帶照明' },
      { id: 'light_backlit', termEn: 'backlit features', termZh: '背光元素' },
    ].map(term => ({ ...term, isCustom: false })),
  },
  {
    id: 'details_decor',
    nameEn: 'Decorative Details',
    nameZh: '裝飾細節',
    isOpen: false,
    terms: [
        { id: 'decor_plants', termEn: 'indoor plants', termZh: '室內植物' },
        { id: 'decor_artwork', termEn: 'abstract artwork', termZh: '抽象藝術品' },
        { id: 'decor_rug', termEn: 'patterned rug', termZh: '圖案地毯' },
        { id: 'decor_books', termEn: 'books on shelves', termZh: '書架上的書' },
        { id: 'decor_mirror', termEn: 'large wall mirror', termZh: '大牆面鏡' },
        { id: 'decor_minimal', termEn: 'minimalist decor', termZh: '極簡裝飾' },
        { id: 'decor_maximal', termEn: 'maximalist decor', termZh: '繁複裝飾' },
    ].map(term => ({ ...term, isCustom: false })),
  },
  {
    id: 'render_style',
    nameEn: 'Image Render Style',
    nameZh: '圖像渲染風格',
    isOpen: false,
    terms: [
        { id: 'render_photorealistic', termEn: 'photorealistic', termZh: '照片級寫實' },
        { id: 'render_concept_art', termEn: 'concept art', termZh: '概念藝術' },
        { id: 'render_3d', termEn: '3D render', termZh: '3D渲染' },
        { id: 'render_magazine', termEn: 'interior design magazine style', termZh: '室內設計雜誌風格' },
        { id: 'render_moody', termEn: 'moody render', termZh: '情調渲染' },
    ].map(term => ({ ...term, isCustom: false })),
  }
];

export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: 'style_modern',
    nameEn: 'Modern',
    nameZh: '現代風格',
    descriptionEn: 'Characterized by simplicity, clean lines, and a neutral color palette. Often incorporates materials like metal, glass, and steel.',
    descriptionZh: '以簡約、俐落的線條和中性色調為特點。通常融合金屬、玻璃和鋼材等材質。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Herman Miller', 'Knoll', 'BoConcept']), 
            termsZh: ensureThreeTerms(['赫曼米勒', '諾爾', '北歐風情']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Focus on functionality.', 'Use monochromatic colors with accent pieces.', 'Declutter and maintain open spaces.']), 
            termsZh: ensureThreeTerms(['注重功能性。', '使用單色系搭配重點飾品。', '保持空間整潔開闊。']) 
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Modern style',
    basePromptZh: '現代風格',
    relatedCategories: ['materials', 'furniture', 'cabinetry', 'lighting', 'photography', 'details_decor', 'render_style', 'human_presence'],
  },
  {
    id: 'style_minimalist',
    nameEn: 'Minimalist',
    nameZh: '極簡風格',
    descriptionEn: 'Takes modern design principles further with an emphasis on extreme simplicity and "less is more". Every element serves a purpose.',
    descriptionZh: '將現代設計原則進一步昇華，強調極致簡約和「少即是多」。每個元素都有其特定用途。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['MUJI', 'Minimalissimo', 'Design Within Reach (select items)']), 
            termsZh: ensureThreeTerms(['無印良品', 'Minimalissimo', 'Design Within Reach (部分選品)']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Strictly neutral color palettes.', 'Focus on form, color, and texture of essential items.', 'Eliminate all non-essential clutter.']), 
            termsZh: ensureThreeTerms(['嚴格的中性色調。', '專注於必需品的形式、色彩和紋理。', '清除所有不必要的雜物。'])
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Minimalist style',
    basePromptZh: '極簡風格',
    relatedCategories: ['materials', 'furniture', 'cabinetry', 'lighting', 'photography', 'render_style'],
  },
  {
    id: 'style_scandinavian',
    nameEn: 'Scandinavian',
    nameZh: '斯堪地那維亞風格 (北歐風)',
    descriptionEn: 'Combines beauty, simplicity, and functionality. Features light colors, natural materials like wood, and cozy textiles.',
    descriptionZh: '結合了美觀、簡約和功能性。特色是淺色調、木材等天然材質以及舒適的紡織品。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['IKEA', 'HAY', 'Normann Copenhagen']), 
            termsZh: ensureThreeTerms(['宜家', 'HAY', '諾曼哥本哈根'])
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Use white and light wood extensively.', 'Incorporate hygge elements (coziness).', 'Maximize natural light.']), 
            termsZh: ensureThreeTerms(['廣泛使用白色和淺色木材。', '融入「Hygge」元素（舒適感）。', '最大化自然採光。'])
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Scandinavian style',
    basePromptZh: '北歐風格',
    relatedCategories: ['materials', 'furniture', 'lighting', 'photography', 'human_presence', 'details_decor', 'render_style'],
  },
  {
    id: 'style_industrial',
    nameEn: 'Industrial',
    nameZh: '工業風格',
    descriptionEn: 'Draws inspiration from warehouses and urban lofts. Common elements include exposed brick, ductwork, wood, and metal.',
    descriptionZh: '從倉庫和都市閣樓中汲取靈感。常見元素包括裸露的磚牆、管線、木材和金屬。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Restoration Hardware', 'West Elm (some collections)', 'CB2 (some collections)']), 
            termsZh: ensureThreeTerms(['Restoration Hardware', '西榆 (部分系列)', 'CB2 (部分系列)']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Embrace raw, unfinished textures.', 'Use a mix of wood and metal.', 'Incorporate vintage or salvaged items.']), 
            termsZh: ensureThreeTerms(['擁抱原始、未完成的紋理。', '混合使用木材和金屬。', '融入復古或回收物件。']) 
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Industrial style',
    basePromptZh: '工業風格',
    relatedCategories: ['materials', 'furniture', 'cabinetry', 'lighting', 'photography', 'render_style'],
  },
  {
    id: 'style_bohemian',
    nameEn: 'Bohemian (Boho)',
    nameZh: '波希米亞風格',
    descriptionEn: 'A carefree, eclectic style with a focus on vibrant colors, patterns, and textures from around the world. Encourages mixing and matching.',
    descriptionZh: '一種自由奔放、不拘一格的風格，著重來自世界各地的鮮豔色彩、圖案和紋理。鼓勵混搭。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Anthropologie', 'Urban Outfitters Home', 'Justina Blakeney Home']), 
            termsZh: ensureThreeTerms(['Anthropologie', 'Urban Outfitters Home', 'Justina Blakeney Home']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Layer textiles: rugs, pillows, throws.', 'Mix patterns and colors boldly.', 'Incorporate plants and natural elements generously.']), 
            termsZh: ensureThreeTerms(['層疊紡織品：地毯、抱枕、蓋毯。', '大膽混合圖案和色彩。', '大量融入植物和自然元素。']) 
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Bohemian style',
    basePromptZh: '波希米亞風格',
    relatedCategories: ['materials', 'furniture', 'lighting', 'photography', 'human_presence', 'details_decor', 'render_style'],
  },
   {
    id: 'style_japandi',
    nameEn: 'Japandi',
    nameZh: '日式侘寂風 (Wabi-Sabi)', 
    descriptionEn: 'A hybrid of Japanese minimalism and Scandinavian functionality. Focuses on clean lines, neutral tones, natural materials, and craftsmanship, embracing the beauty of imperfection.',
    descriptionZh: '日本極簡主義與斯堪地那維亞功能性的混合體。著重簡潔線條、中性色調、天然材質和工藝，擁抱不完美之美。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Karimoku Case Study', 'Ariake Collection', 'Ouur by Kinfolk']), 
            termsZh: ensureThreeTerms(['Karimoku Case Study', 'Ariake Collection', 'Ouur by Kinfolk']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Emphasize craftsmanship and quality materials.', 'Maintain a clutter-free environment.', 'Use a palette of muted earthy tones and soft neutrals.']), 
            termsZh: ensureThreeTerms(['強調工藝和優質材料。', '保持環境整潔。', '使用柔和的大地色調和中性色。'])
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Japandi style, wabi-sabi influence',
    basePromptZh: '日式侘寂風格',
    relatedCategories: ['materials', 'furniture', 'cabinetry', 'lighting', 'photography', 'details_decor', 'render_style'],
  },
  {
    id: 'style_coastal',
    nameEn: 'Coastal',
    nameZh: '海岸風格',
    descriptionEn: 'Light, airy, and reminiscent of the beach. Features cool neutral shades, blues, whites, and natural materials like wood and rattan.',
    descriptionZh: '輕盈、通透，令人聯想到海灘。以冷色調中性色、藍色、白色以及木材和藤編等天然材質為特色。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Serena & Lily', 'Pottery Barn (coastal collections)', 'Wayfair (various)']), 
            termsZh: ensureThreeTerms(['Serena & Lily', 'Pottery Barn (海岸系列)', 'Wayfair (眾多品牌)']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Use light and breezy fabrics.', 'Incorporate nautical or beach-themed decor subtly.', 'Maximize natural light, use sheer curtains.']), 
            termsZh: ensureThreeTerms(['使用輕盈透氣的布料。', '巧妙融入航海或海灘主題裝飾。', '最大化自然光，使用薄紗窗簾。']) 
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Coastal style',
    basePromptZh: '海岸風格',
    relatedCategories: ['materials', 'furniture', 'lighting', 'photography', 'human_presence', 'details_decor', 'render_style'],
  },
  {
    id: 'style_farmhouse',
    nameEn: 'Farmhouse',
    nameZh: '農舍風格',
    descriptionEn: 'Warm, cozy, and rustic with a touch of modern sensibility. Features reclaimed wood, vintage accessories, and comfortable furniture.',
    descriptionZh: '溫馨、舒適且帶有質朴感，並融入現代氣息。以回收木材、復古飾品和舒適的家具為特色。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Magnolia Home', 'Birch Lane', 'Antique Farmhouse']), 
            termsZh: ensureThreeTerms(['Magnolia Home', 'Birch Lane', 'Antique Farmhouse']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Mix old and new elements.', 'Use a neutral palette with warm wood tones.', 'Incorporate shiplap walls or barn doors.']), 
            termsZh: ensureThreeTerms(['混合新舊元素。', '使用中性色調搭配溫暖的木質色調。', '融入企口板牆或穀倉門。']) 
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Farmhouse style',
    basePromptZh: '農舍風格',
    relatedCategories: ['materials', 'furniture', 'cabinetry', 'lighting', 'photography', 'human_presence', 'details_decor', 'render_style'],
  },
  {
    id: 'style_mid_century_modern',
    nameEn: 'Mid-Century Modern',
    nameZh: '中古世紀現代風格',
    descriptionEn: 'Revisits the iconic style of the mid-20th century (roughly 1933-1965). Features organic and geometric forms, clean lines, and a connection to nature.',
    descriptionZh: '重現20世紀中期（約1933-1965年）的標誌性風格。以有機和幾何形式、簡潔線條以及與自然的連結為特色。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Herman Miller (vintage)', 'Knoll (vintage)', 'Article']), 
            termsZh: ensureThreeTerms(['赫曼米勒 (古董)', '諾爾 (古董)', 'Article'])
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Iconic furniture pieces are key.', 'Wood, particularly teak, is prevalent.', 'Use bold accent colors and graphic patterns.']), 
            termsZh: ensureThreeTerms(['標誌性的家具是關鍵。', '木材，尤其是柚木，非常普遍。', '使用大膽的強調色和圖形圖案。']) 
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Mid-Century Modern style',
    basePromptZh: '中古世紀現代風格',
    relatedCategories: ['materials', 'furniture', 'lighting', 'photography', 'details_decor', 'render_style'],
  },
  {
    id: 'style_art_deco',
    nameEn: 'Art Deco',
    nameZh: '裝飾藝術風格',
    descriptionEn: 'Originating in the 1920s and 1930s, characterized by rich ornamentation, geometric patterns, symmetry, and luxurious materials like metallics and exotic woods.',
    descriptionZh: '起源於1920和1930年代，以豐富的裝飾、幾何圖案、對稱性以及金屬和異國木材等奢華材料為特點。',
    dynamicDetails: [
        { 
            labelEn: "Suggested Furniture/Brands", 
            labelZh: "建議家具/品牌", 
            termsEn: ensureThreeTerms(['Jonathan Adler (Deco-inspired)', 'Koket', 'Antiques or Reproductions']), 
            termsZh: ensureThreeTerms(['Jonathan Adler (裝飾藝術風格靈感)', 'Koket', '古董或複製品']) 
        },
        { 
            labelEn: "Decor Tips", 
            labelZh: "佈置技巧", 
            termsEn: ensureThreeTerms(['Bold geometric shapes (chevrons, sunbursts).', 'Luxurious materials: chrome, brass, lacquer, velvet.', 'Symmetrical arrangements and opulent details.']), 
            termsZh: ensureThreeTerms(['大膽的幾何形狀（V形圖案、放射狀圖案）。', '奢華材料：鉻、黃銅、亮漆、天鵝絨。', '對稱佈置和華麗細節。']) 
        }
    ] as [DynamicDetailSet, DynamicDetailSet],
    basePromptEn: 'Art Deco style',
    basePromptZh: '裝飾藝術風格',
    relatedCategories: ['materials', 'furniture', 'lighting', 'photography', 'details_decor', 'render_style'],
  }
].map(style => ({...style, isCustom: false}));
