export const useConstants = () => {
    const eventTypeDetails: { [key in EventType]: { name: string; color: string; } } = {
        normal: { name: '通常業務', color: '#6c757d' },
        meeting: { name: '会議', color: '#4361ee' },
        focus: { name: '集中作業', color: '#F95A5A' },
        away: { name: '外出・出張', color: '#00C2FF' },
        vacation: { name: '休暇・不在', color: '#F59E0B' },
        other: { name: 'その他', color: '#34D399' },
    };

    /**
     * 勤務形態のマスターデータ
     */
    const WORK_STYLES = [
        { value: 'office', label: '出社' },
        { value: 'remote', label: 'リモート' },
        { value: 'out', label: '外出・出張' },
        { value: 'vacation', label: '休暇' },
    ] as const;

    const workstyleDetails: { [key in WorkStyle]: { name: string; color: string; icon: string; size: string; } } = {
        /** 出社: 信頼感・公式なイメージの青 */
        office: { name: '出社', color: '#1976D2', icon: 'mdi-office-building', size: 'small' },
        /** リモート: 在宅・オンラインを示す緑 */
        remote: { name: 'リモート', color: '#43A047', icon: 'mdi-home', size: 'small' },
        /** 外出・出張: 注意喚起やアクティブな状態を示すオレンジ */
        out: { name: '外出・出張', color: '#FB8C00', icon: 'mdi-wallet-travel', size: 'small' },
        /** 休暇: 非アクティブ・不在を示す落ち着いたグレー */
        vacation: { name: '休暇', color: '#F95A5A', icon: 'mdi-account-off', size: 'small' },
        /** 未定 */
        pending: { name: '未定', color: '#a3a3a3ff', icon: 'mdi-office-building', size: 'small' },
    };

    /**
     * 参加可否のマスターデータ
     */
    const PARTICIPATION_STATUSES = [
        { value: 'possible', label: '可能' },
        { value: 'impossible', label: '不可能' },
    ] as const;

    const participationLunchStatusDetails: { [key in ParticipationStatus]: { name: string; color: string; icon: string; size: string; } } = {
        possible: { name: '可能', color: '#43A047', icon: 'mdi-food-fork-drink', size: 'small' },
        impossible: { name: '不可能', color: '#F95A5A', icon: 'mdi-food-fork-drink', size: 'small' },
        pending: { name: '未定', color: '#a3a3a3ff', icon: 'mdi-food-fork-drink', size: 'small' },
    };

    const participationDinnerStatusDetails: { [key in ParticipationStatus]: { name: string; color: string; icon: string; size: string; } } = {
        possible: { name: '可能', color: '#43A047', icon: 'mdi-glass-mug-variant', size: 'small' },
        impossible: { name: '不可能', color: '#F95A5A', icon: 'mdi-glass-mug-variant', size: 'small' },
        pending: { name: '未定', color: '#a3a3a3ff', icon: 'mdi-glass-mug-variant', size: 'small' },
    };

    return {
        eventTypeDetails,
        workstyleDetails,
        participationLunchStatusDetails,
        participationDinnerStatusDetails,
        WORK_STYLES,
        PARTICIPATION_STATUSES,
    }
}