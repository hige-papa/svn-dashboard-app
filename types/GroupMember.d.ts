interface GroupMember {
    id: string
    code: string
    type: 'user' | 'facility' | 'equipment'
    name: string
    avatar?: string
}