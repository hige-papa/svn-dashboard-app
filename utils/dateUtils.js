/**
 * 日付関連のユーティリティ関数
 */

/**
 * 曜日を日本語で取得
 * @param {Date} date - 日付オブジェクト
 * @returns {string} 日本語の曜日
 */
export const getDayOfWeek = (date) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

/**
 * 日付をYYYY/MM/DD形式でフォーマット
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマットされた日付
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 時間文字列をピクセル位置に変換
 * @param {string} timeStr - 時間文字列（HH:MM形式）
 * @returns {number} ピクセル位置
 */
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  // 8時からの経過時間をピクセル位置に変換
  // 30分 = 32px の比率で計算
  return ((hours - 8) * 60 + minutes) * (32 / 30);
};

/**
 * 時間枠を生成（8:00から20:00）
 * @returns {Array} 時間枠の配列
 */
export const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour}:00`);
    timeSlots.push(`${hour}:30`);
  }
  return timeSlots;
};

/**
 * 特定の日のスケジュールを取得
 * @param {Array} schedules - スケジュールデータの配列
 * @param {Date} currentDate - 対象の日付
 * @returns {Array} フィルタリングされたスケジュール
 */
export const getDaySchedules = (schedules, currentDate) => {
  const targetDate = formatDate(currentDate).replace(/\//g, '-');
  return schedules.filter(schedule => schedule.date === targetDate);
};