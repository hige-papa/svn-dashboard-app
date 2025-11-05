<template>
    <div>
        <v-text-field label="入力①" v-model="request.name" />
        <v-text-field label="入力②" v-model="request.name2.key1" />
        <div>
            {{ request }}
        </div>
        <div>
            <v-btn @click.stop="getData">送信</v-btn>
        </div>
        <v-data-table
            :items="data"
            :headers="headers">
        </v-data-table>
    </div>
</template>

<script setup lang="ts">
const url = 'https://153.127.33.249:8443/api/attendance/employees'

const data = ref<any>()

interface InputFormDetail {
    key1: string
    key2: string
}

interface InputForm {
    name: string
    name2: InputFormDetail
}

const request = ref<InputForm>({
    name: '',
    name2: {
        key1: '',
        key2: ''
    }
})

const getData = async () => {
    return await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async response => {
        if (response) {
            return await response.json()
        }
        return null
    }).catch(error => {
        console.error(error)
    })
    // return await fetch(url, {
    //     method: 'POST',
    //     body: JSON.stringify(request.value)
    // }).then(async response => {
    //     if (response) {
    //         return await response.json()
    //     }
    //     return null
    // }).catch(error => {
    //     console.error(error)
    // })
}

const headers = [
    { title: "portalId", value: 'portalId' },
    { title: "portal区分", value: 'portal区分' },
    { title: "内線", value: '内線' },
    { title: "社員ID", value: '社員ID' },
    { title: "日時", value: '日時' },
    { title: "状態", value: '状態' },
]

onMounted(async () => {
    data.value = await getData()
})
</script>