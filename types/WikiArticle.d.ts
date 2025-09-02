interface WikiArticle {
    id: number
    title: string
    category: string
    summary: string
    content: string
    author: string
    department: string
    created_date: string
    updated_date: string
    tags: string[]
    status: 'published' | 'draft' | 'archived'
    views: number
    image?: string
}