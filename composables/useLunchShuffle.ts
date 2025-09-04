import { ref, onUnmounted } from 'vue'
import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  getDoc,
  type DocumentSnapshot,
  type FirestoreError,
  type Firestore
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { LunchShuffle, LunchShuffleUpdate } from '~/types/LunchShuffle'

/**
 * ランチシャッフル機能のリアルタイムデータ管理
 * @description Firestoreとの双方向同期、チーム分割アルゴリズム、エラーハンドリングを提供
 * @prerequisite Firebase認証済みユーザー、Firestoreインスタンス必須
 * @sideeffects リアルタイムリスナーの登録・解除、Firestoreの読み書き
 */
export const useLunchShuffle = () => {
  const user = useState<User>('user')
  const firestore = useState<Firestore>('db')

  const lunchData = ref<LunchShuffle | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // 固定のドキュメントID（全ユーザーで共有）
  const LUNCH_DOC_ID = 'shared-lunch-shuffle'
  
  let unsubscribe: (() => void) | null = null

  /**
   * Firestoreリアルタイムリスナーの開始
   * @description 共有ドキュメントの変更を監視し、ローカル状態と同期
   * @sideeffects onSnapshotコールバック登録、エラー時の状態更新
   */
  const startRealtimeListener = () => {
    // 既存リスナーのクリーンアップ
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    if (!firestore.value) {
      error.value = 'Firestoreが初期化されていません'
      isLoading.value = false
      return
    }

    const docRef = doc(firestore.value, 'lunchShuffle', LUNCH_DOC_ID)
    
    unsubscribe = onSnapshot(docRef, (docSnapshot: DocumentSnapshot) => {
      if (docSnapshot.exists()) {
        lunchData.value = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as LunchShuffle
      } else {
        // ドキュメントが存在しない場合は初期化
        initializeLunchData()
      }
      isLoading.value = false
    }, (err: FirestoreError) => {
      console.error('リアルタイムリスナーエラー:', err)
      error.value = 'データの同期に失敗しました'
      isLoading.value = false
    })
  }

  /**
   * 初期データの作成
   * @description 共有ドキュメントが存在しない場合の初期化処理
   * @prerequisite 認証済みユーザー必須
   * @sideeffects Firestoreドキュメント作成、ローカル状態更新
   */
  const initializeLunchData = async () => {
    if (!user.value) return

    const initialData: LunchShuffle = {
      id: LUNCH_DOC_ID,
      participants: Array(20).fill(''),
      teams: '[]', // 空配列のJSON文字列
      resultMessage: '',
      lastShuffledAt: null,
      lastShuffledBy: null,
      updatedAt: new Date().toISOString(),
      updatedBy: user.value.uid
    }

    try {
      const docRef = doc(firestore.value, 'lunchShuffle', LUNCH_DOC_ID)
      await setDoc(docRef, initialData)
      lunchData.value = initialData
    } catch (err) {
      console.error('初期化エラー:', err)
      error.value = '初期化に失敗しました'
      // 初期化失敗時もリスナーは残る可能性があるため、明示的にクリーンアップ
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }
  }

  // 参加者リストの更新
  const updateParticipants = async (participants: string[]) => {
    if (!user.value || !lunchData.value) return

    const updateData = {
      participants,
      updatedAt: new Date().toISOString(),
      updatedBy: user.value.uid
    }

    try {
      const docRef = doc(firestore.value, 'lunchShuffle', LUNCH_DOC_ID)
      await updateDoc(docRef, updateData)
    } catch (err) {
      console.error('参加者更新エラー:', err)
      error.value = '参加者の更新に失敗しました'
      // Firestore更新失敗時はローカル状態をリセット
      throw err
    }
  }

  // シャッフル結果の更新
  const updateTeams = async (teams: string[][], resultMessage: string = '') => {
    if (!user.value || !lunchData.value) return

    // 型安全性の確保: teamsが空配列でもJSON.stringifyは安全
    const teamsJson = JSON.stringify(teams)
    if (typeof teamsJson !== 'string') {
      throw new Error('チーム情報のシリアライズに失敗しました')
    }

    const updateData = {
      teams: teamsJson,
      resultMessage,
      lastShuffledAt: new Date().toISOString(),
      lastShuffledBy: user.value.uid,
      updatedAt: new Date().toISOString(),
      updatedBy: user.value.uid
    }

    try {
      const docRef = doc(firestore.value, 'lunchShuffle', LUNCH_DOC_ID)
      await updateDoc(docRef, updateData)
    } catch (err) {
      console.error('チーム更新エラー:', err)
      error.value = 'チームの更新に失敗しました'
      throw err
    }
  }

  // 参加者の個別更新（リアルタイム入力用）
  const updateSingleParticipant = async (index: number, name: string) => {
    if (!lunchData.value) return

    const updatedParticipants = [...lunchData.value.participants]
    updatedParticipants[index] = name
    await updateParticipants(updatedParticipants)
  }

  // Fisher–Yates シャッフル
  const shuffleArray = <T>(arr: T[]): T[] => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * 最適なチームサイズを計算
   * @param n 総参加者数
   * @returns 各チームの人数配列
   * @description 3-4名を基本とし、余りを適切に配分
   */
  const getGroupSizes = (n: number): number[] => {
    if (n <= 5) return [n]
    
    const k = Math.floor(n / 4)
    const r = n % 4
    let sizes = Array(k).fill(4)
    
    if (r === 0) return sizes
    if (r === 1) {
      if (k >= 2) {
        sizes.splice(0, 2)
        sizes.push(3, 3, 3)
      } else {
        sizes = [3, 3, 3]
      }
    } else if (r === 2) {
      if (k >= 1) {
        sizes.splice(0, 1)
        sizes.push(3, 3)
      } else {
        sizes = [3, 3]
      }
    } else if (r === 3) {
      sizes.push(3)
    }
    
    return sizes
  }

  /**
   * 参加者をランダムにチーム分け
   * @param names 参加者名の配列
   * @returns チーム配列（各チームは参加者名の配列）
   */
  const makeTeams = (names: string[]): string[][] => {
    const n = names.length
    if (n === 0) return []
    
    const shuffled = shuffleArray(names)
    const sizes = getGroupSizes(n)
    const teamList: string[][] = []
    let idx = 0
    
    for (const size of sizes) {
      const slice = shuffled.slice(idx, idx + size)
      teamList.push(slice)
      idx += size
    }
    
    if (idx < shuffled.length) {
      const lastTeam = teamList[teamList.length - 1]
      if (lastTeam) {
        lastTeam.push(...shuffled.slice(idx))
      }
    }
    
    return teamList
  }

  /**
   * チームシャッフルの実行
   * @returns 実行結果オブジェクト（成功/失敗、エラーメッセージ、チーム情報）
   * @description 参加者のバリデーション、チーム分割、タイムスタンプ付き結果生成
   * @sideeffects Firestoreドキュメント更新
   */
  const executeShuffle = async () => {
    if (!lunchData.value) {
      return { success: false, error: 'データが読み込まれていません' }
    }

    const names = lunchData.value.participants
      .map(name => name.replace(/\s+/g, ' ').trim())
      .filter(name => name.length > 0)

    if (names.length === 0) {
      return { success: false, error: '参加者が入力されていません。少なくとも1名以上を入力してください。' }
    }

    const teams = makeTeams(names)
    
    if (teams.length > 26) {
      return { success: false, error: 'チーム数が Z を超えました。人数を減らしてください。' }
    }

    // チーム構成をメッセージとして生成
    const getTeamName = (index: number): string => {
      return String.fromCharCode(65 + index) // A, B, C...
    }
    
    // タイムスタンプ生成
    const now = new Date()
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    const teamMessage = `${timestamp}\n` + teams
      .map((team, index) => `${getTeamName(index)}チーム：${team.join('、')}`)
      .join('\n')

    await updateTeams(teams, teamMessage)
    
    return { success: true, teams, message: teamMessage }
  }

  // 全クリア
  const clearAll = async () => {
    const emptyParticipants = Array(20).fill('')
    await updateParticipants(emptyParticipants)
    await updateTeams([], '') // 結果メッセージもクリア
  }

  // クリーンアップ
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  // 手動クリーンアップ関数（コンポーネント外での使用時）
  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    lunchData,
    isLoading,
    error,
    startRealtimeListener,
    updateSingleParticipant,
    updateParticipants,
    executeShuffle,
    clearAll,
    cleanup
  }
}
