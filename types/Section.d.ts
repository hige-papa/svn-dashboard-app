interface SectionFormData {
  name: string
  code: string
  description: string
  category: string
  imageUrl: string
  status: 'available' | 'in_use' | 'maintenance'
}

interface Section extends SectionFormData {
  id: string
}

interface SectionFormErrors {
  name?: string
  code?: string
  category?: string
}