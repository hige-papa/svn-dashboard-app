/**
 * 勤務形態の型定義
 * - 'office': 出社
 * - 'remote': リモート
 * - 'out': 外出
 * - 'vacation': 休暇
 */
type WorkStyle = 'office' | 'remote' | 'out' | 'vacation' | 'pending';

/**
 * 参加可否の型定義
 * - 'possible': 可能
 * - 'impossible': 不可能
 */
type ParticipationStatus = 'possible' | 'impossible' | 'pending';

/**
 * ユーザーの日別オプション情報を管理するインターフェース
 */
interface DailyUserOption {
    id?: string;
    /** ユーザーID */
    uid: string;
    /** 日付 (YYYY-MM-DD) */
    date: string;
    /** 勤務形態 */
    workStyle: WorkStyle;
    /** ランチ会参加可否 */
    lunchParticipation: ParticipationStatus;
    /** 夕食会参加可否 */
    dinnerParticipation: ParticipationStatus;
}