<script setup lang="ts">
import menu from '~/assets/data/menu.json'
import { useDisplay } from 'vuetify'
import type { User } from 'firebase/auth'

const user = useState<User>('user')

const { mobile } = useDisplay()

const state = useState<AppState>('appState')
</script>

<template>
  <v-navigation-drawer v-model="state.drawer" :rail="state.rail" :permanent="!mobile">

    <v-list>
      <v-list-item prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg" :title="user.displayName ?? 'ユーザー'" :subtitle="user.email ?? undefined">
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <template v-for="section in menu" :key="`section-${section.id}`">
      <v-list density="compact">
        <v-list-subheader v-if="state.rail === false">{{ section.title }}</v-list-subheader>
        <v-list-item v-for="m in section.menu" :key="`menu-${m.id}`" @click.stop="navigateTo(m.path)" density="compact">
          <template v-slot:prepend>
            <v-icon :icon="m.icon" size="small"></v-icon>
          </template>
          <template v-slot:title>
            <span v-if="state.rail === false" class="text-body-2">{{ m.label }}</span>
          </template>
        </v-list-item>
      </v-list>
      <v-divider></v-divider>
    </template>

    <v-divider></v-divider>

    <v-list>
      <v-list-item :class="[{'d-flex flex-row-reverse' : !state.rail}]">
        <v-icon :icon="state.rail ? 'mdi-chevron-right' : 'mdi-chevron-left'" variant="text" @click.stop="state.rail = !state.rail"></v-icon>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style lang="css" scoped>
</style>