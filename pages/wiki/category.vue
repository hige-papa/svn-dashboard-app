<template>
    <v-container class="fill-height">
        <v-card class="w-100 h-100">
            <v-card-title>
                <v-btn
                    variant="text"
                    @click.stop="navigateTo('/wiki')">
                    <template v-slot:prepend>
                        <v-icon>mdi-chevron-left</v-icon>
                    </template>
                    戻る
                </v-btn>
            </v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="4">
                        <v-card>
                            <v-card-text>
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field v-model="addition.text" placeholder="タグのテキストを入力してください"
                                            density="compact" variant="outlined" hide-details class="ma-2">
                                        </v-text-field>
                                    </v-col>
                                    <v-col cols="6" class="d-flex align-center justify-end">
                                        <v-chip :color="addition.color" class="ma-2">{{ addition.text }}</v-chip>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-color-picker
                                            v-model="addition.color"
                                            hide-inputs
                                            class="ma-2">
                                        </v-color-picker>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color="primary" variant="text" @click.stop="addCategory">登録</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                    <v-col cols="8">
                        <v-chip
                            v-for="(category, index) in categories"
                            :key="`category-${index}`"
                            :color="category.color"
                            class="ma-1">
                            <template v-slot:append>
                                <v-btn size="20" variant="flat" icon @click.stop="startDelete(category)" class="ml-1">
                                    <v-icon size="x-small">mdi-close</v-icon>
                                </v-btn>
                            </template>
                            {{ category.text }}
                        </v-chip>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-container>
    <v-dialog v-model="showDeleteDialog" class="w-25">
        <v-card v-if="deleteTarget">
            <v-card-text>
                <v-chip :color="deleteTarget.color" class="ma-2">{{ deleteTarget.text }}</v-chip>
                <p>このタグを削除しても良いですか？</p>
                <p>この操作は取り消せません。</p>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" variant="text" @click.stop="cancelDelete">キャンセル</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="error" variant="elevated" @click.stop="confirmDelete">削除</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useMaster } from '~/composables/master/useMaster'

const { addAsync: addCategoryAsync, getListAsync: getCategoriesAsync, deleteAsync: deleteCategoryAsync } = useMaster('categories')

const categories = ref<Tag[]>([])

const addition = ref<Tag>({
    text: 'テキスト',
    color: '#000000'
})

const addCategory = () => {
    addCategoryAsync(addition.value).then(response => {
        if (response) {
            categories.value.push(response)
            addition.value = {
                text: 'テキスト',
                color: '#000000'
            }
        }
    })
}

const showDeleteDialog = ref<boolean>(false)

const deleteTarget = ref<Tag>()

const startDelete = (category: Tag) => {
    deleteTarget.value = category
    showDeleteDialog.value = true
}

const cancelDelete = () => {
    deleteTarget.value = undefined
    showDeleteDialog.value = false
}

const confirmDelete = () => {
    if (deleteTarget.value?.id) {
        deleteCategoryAsync(deleteTarget.value.id).then(_ => {
            categories.value = categories.value.filter(t => { return t.id != deleteTarget.value?.id })
            deleteTarget.value = undefined
            showDeleteDialog.value = false
        })
    }
}

onMounted(() => {
    getCategoriesAsync().then(response => {
        categories.value = response
    })
})
</script>