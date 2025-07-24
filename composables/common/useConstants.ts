export const useConstants = () => {
    const eventTypeDetails: { [key in EventType]: { name: string; color: string; } } = {
        normal: { name: '通常業務', color: '#6c757d' },
        meeting: { name: '会議', color: '#4361ee' },
        focus: { name: '集中作業', color: '#F95A5A' },
        away: { name: '外出・出張', color: '#00C2FF' },
        vacation: { name: '休暇・不在', color: '#F59E0B' },
        other: { name: 'その他', color: '#34D399' },
    };

    return {
        eventTypeDetails,
    }
}