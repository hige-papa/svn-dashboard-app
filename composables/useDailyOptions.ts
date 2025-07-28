// composables/useDailyOptions.ts
import { ref, watch, onMounted, type Ref } from 'vue';
import { useDailyOptionService } from '~/services/dailyOptionService';

// useCalendarなど、他のComposableから日付やビューのRefを受け取り、同期することを想定
export const useDailyOptions = (currentDate: Ref<Date | null>, currentView: Ref<string>) => {

  // --- Services ---
  const dailyOptionService = useDailyOptionService();

  // --- State ---
  const dailyOptions = ref<DailyUserOption[]>([]);
  const isLoading = ref(false);

  // --- Utility Functions ---
  // タイムゾーン問題を避けるため、YYYY-MM-DD形式の文字列で日付を扱う
  const formatDateForDb = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Date Range Calculation ---
  // useCalendar.ts と同じロジックで、表示範囲に応じた期間を計算
  const getCurrentDateRange = (): { startDate: string; endDate: string } => {
    const d = new Date(currentDate.value ?? new Date());
    let startDate: Date, endDate: Date;

    if (currentView.value === 'monthly') {
      startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // 月カレンダーの開始日 (前の月の日曜日)
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 41); // 6週間後
    } else if (currentView.value === 'weekly') {
      const dayOfWeek = d.getDay();
      // 週の開始を月曜日に設定
      startDate = new Date(d);
      startDate.setDate(d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else { // daily
      startDate = d;
      endDate = d;
    }
    return { startDate: formatDateForDb(startDate), endDate: formatDateForDb(endDate) };
  };

  // --- Core Data Loading ---
  const loadDailyOptions = async () => {
    isLoading.value = true;
    try {
      const dateRange = getCurrentDateRange();
      // サービスを呼び出し、表示範囲内の全ユーザーの日別ステータスを取得
      const optionsData = await dailyOptionService.getDailyOptionsInRange(
        dateRange.startDate,
        dateRange.endDate
      );
      dailyOptions.value = optionsData;
    } catch (error) {
      console.error('Failed to load daily options data:', error);
      dailyOptions.value = []; // エラー時は空にする
    } finally {
      isLoading.value = false;
    }
  };

  // --- Getter Functions ---
  /**
   * 特定のユーザーの特定の日付のオプションを取得します。
   * UIで表示するために、読み込み済みのデータから高速にフィルタリングします。
   * @param userId ユーザーID
   * @param date 日付オブジェクト
   * @returns 見つかったDailyUserOption、またはundefined
   */
  const getUserOptionForDay = (userId: string, date: Date | null): DailyUserOption | undefined => {
    if (!date || !userId) return undefined;
    const dateString = formatDateForDb(date);
    return dailyOptions.value.find(option => option.uid === userId && option.date === dateString);
  };

  // --- Actions ---
  /**
   * ユーザーの日別ステータスを設定（作成/更新）し、データを再読み込みします。
   * @param optionData 保存するデータ
   */
  const setDailyOption = async (optionData: Omit<DailyUserOption, 'id'>) => {
    try {
      await dailyOptionService.setDailyOption(optionData);
      await loadDailyOptions(); // 変更を即時反映するためにデータをリフレッシュ
    } catch (error) {
      console.error("Failed to set daily option:", error);
      // ここでUIにエラー通知を出すなどの処理も可能
    }
  };

  // --- Lifecycle and Watchers ---
  // マウント時と、日付・ビューの変更を監視してデータを再取得
  onMounted(loadDailyOptions);
  watch([currentDate, currentView], loadDailyOptions, { deep: true });

  return {
    dailyOptions,
    isLoading,
    loadDailyOptions,
    getUserOptionForDay,
    setDailyOption,
  };
};