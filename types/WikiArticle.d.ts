interface WikiArticleForm {
    title: string
    category: string
    summary: string
    content: string
    tags: string[]
    image?: string
    author: string
    department: string
}

interface WikiArticle extends WikiArticleForm {
    id: string
    createdAt: string
    updatedAt: string
    status: 'published' | 'draft' | 'archived'
    views: number
    version: number
}

interface WikiArticleHistory {
    snapshot: WikiArticle
    version: number
    createdAt: string
    updatedAt: string
}