import { useTransaction } from '~/composables/transaction/useTransaction';

export default defineNuxtPlugin(async () => {
    const appState = ref<AppState>({
        drawer: true,
        rail: true,
    });

    const { getListAsync } = useTransaction('schedule');

    // const events = ref(await getListAsync());

    useState('appState', () => appState);
    // useState('events', () => events);
})