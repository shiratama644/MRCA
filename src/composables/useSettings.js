import { reactive, watch, onMounted } from 'vue';

const SETTINGS_KEY = 'srx-settings';

const defaultSettings = {
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    lineHeight: 1.5,
    wordWrap: true
};

export function useSettings() {
    const settings = reactive({ ...defaultSettings });

    onMounted(() => {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            try {
                Object.assign(settings, JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
    });

    watch(settings, (newVal) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newVal));
    });

    return { settings };
}