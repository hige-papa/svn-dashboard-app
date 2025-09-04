/**
 * ランチシャッフル機能のメインデータ構造
 * @description 全ユーザー間で共有されるリアルタイムデータ
 */
export interface LunchShuffle {
  /** ドキュメント識別子（固定値: 'shared-lunch-shuffle'） */
  id: string
  /** 参加者名リスト（固定20要素、空文字列含む） */
  participants: string[]
  /** チーム分割結果（string[][]のJSON文字列形式） */
  teams: string
  /** タイムスタンプ付きチーム分割結果メッセージ */
  resultMessage: string
  /** 最終シャッフル実行日時（ISO 8601形式） */
  lastShuffledAt: string | null
  /** 最終シャッフル実行ユーザーUID */
  lastShuffledBy: string | null
  /** 最終更新日時（ISO 8601形式） */
  updatedAt: string
  /** 最終更新ユーザーUID */
  updatedBy: string
}

/**
 * ランチシャッフルデータの部分更新用インターフェース
 * @description Firestore updateDoc用の型定義
 */
export interface LunchShuffleUpdate {
  participants?: string[]
  teams?: string
  resultMessage?: string
  lastShuffledAt?: string | null
  lastShuffledBy?: string | null
  /** 必須: 更新日時 */
  updatedAt: string
  /** 必須: 更新ユーザーUID */
  updatedBy: string
}

/**
 * シャッフル実行結果
 */
export interface ShuffleResult {
  /** 実行成功フラグ */
  success: boolean
  /** エラーメッセージ（失敗時） */
  error?: string
  /** チーム分割結果（成功時） */
  teams?: string[][]
  /** フォーマット済み結果メッセージ（成功時） */
  message?: string
}
