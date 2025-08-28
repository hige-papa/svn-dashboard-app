<template>
  <v-navigation-drawer v-model="state.drawer" :rail="state.rail" :permanent="!mobile" class="drawer-area">

    <v-list>
      <v-list-item :title="user?.displayName ?? 'ユーザー'" :subtitle="user?.role ?? undefined" @click="navigateTo('/profile')">
        <template v-slot:prepend>
          <v-avatar>
            <v-img v-if="user?.avatar" :src="user?.avatar" cover></v-img>
            <v-icon v-else size="small">mdi-account</v-icon>
          </v-avatar>
        </template>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <template v-for="section in menu" :key="`section-${section.id}`">
      <v-list v-if="checkRole(section)" density="compact">
        <v-list-subheader v-if="state.rail === false">{{ section.title }}</v-list-subheader>
        <template v-for="m in section.menu" :key="`menu-${m.id}`">
          <v-list-item v-if="checkRole(m)" @click.stop="navigateTo(m.path)" density="compact">
            <template v-slot:prepend>
              <v-icon :icon="m.icon" size="small"></v-icon>
            </template>
            <template v-slot:title>
              <span v-if="state.rail === false" class="text-body-2">{{ m.label }}</span>
            </template>
          </v-list-item>
        </template>
      </v-list>
      <v-divider v-if="checkRole(section)"></v-divider>
    </template>

    <v-list density="compact">
      <v-list-item density="compact" @click.stop="logoutAsync">
          <template v-slot:prepend>
            <v-icon icon="mdi-logout" size="small"></v-icon>
          </template>
          <template v-slot:title>
            <span v-if="state.rail === false" class="text-body-2">ログアウト</span>
          </template>
        </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list bg-color="white" class="open-close-btn-area pa-0 ma-0">
      <v-list-item :class="[{'d-flex flex-row-reverse' : !state.rail}]">
        <template #prepend>
          <v-icon v-if="state.rail" icon="mdi-chevron-right" variant="text" @click.stop="state.rail = !state.rail"></v-icon>
        </template>
        <template #append>
          <v-icon v-if="!state.rail" icon="mdi-chevron-left" variant="text" @click.stop="state.rail = !state.rail"></v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/firebase/useAuth'
import menu from '~/assets/data/menu.json'
import { useDisplay } from 'vuetify'

const user = useState<ExtendedUserProfile>('userProfile')

const { logoutAsync } = useAuth()

const { mobile } = useDisplay()

const state = useState<AppState>('appState')

const checkRole = (menu: any) => {
  if (menu?.roles?.length) {
    return user.value ? menu.roles.indexOf(user.value.role ?? '') >= 0 : false
  } else {
    return true
  }
}
</script>

<style scoped>
.drawer-area {
  position: relative;
}

.open-close-btn-area {
  position: sticky;
  width: 100%;
  left: 0;
  bottom: 0;
  z-index: 1;
}
</style>