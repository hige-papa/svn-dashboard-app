interface TeamFormData {
  name: string
  code: string
  description: string
  category: string
  imageUrl: string
  status: 'available' | 'in_use' | 'maintenance'
}

interface Team extends TeamFormData {
  id: string
}

interface TeamFormErrors {
  name?: string
  code?: string
  category?: string
}