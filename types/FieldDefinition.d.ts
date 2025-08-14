interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'month' | 'email' | 'url' | 'tel' | 'select' | 'combo' | 'select-group' | 'combo-group' | 'search-form' | 'search-form-group' | 'input-search' | 'rows' | 'product-search' | 'supplier-search' | 'calculate'
  required?: boolean
  header?: boolean
  sortable?: boolean
  searchable?: boolean
  placeholder?: string
  groupName?: string
  readonly?: boolean
  icon?: string,
  sourceType?: 'firestore' | 'fixed'
  source?: string
  sourceTitle?: string
  sourceValue?: string
  items?: SelectItem[]
  defaultItem?: SelectItem
  options?: any
  visible?: boolean
  cols?: string | number
  fields?: FieldDefinition[],
  searchFields?: SearchFieldDefinition[],
  fixedCondition?: Record<string, any>,
  inputSearchKey?: string
  width?: string,
  maps?: MapItem[]
  formura?: string,
}

interface SearchFieldDefinition {
  name: string
  label: string
  type: 'text' | 'number' 
}

interface SectionDefinition {
  title: string;
  type?: 'modal' | 'tab'
  fields: FieldDefinition[];
}

interface PageFieldDefinition {
  detailWidth: string
  sections: SectionDefinition[];
}

// sselect.combo選択肢のアイテムの型定義
interface SelectItem {
  title: string;
  value: any;
}

interface MapItem {
  sourceKey: string;
  destKey: string;
}