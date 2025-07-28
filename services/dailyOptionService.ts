// services/dailyOptionService.ts

import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'
import { where } from 'firebase/firestore'

/**
 * DailyUserOptionデータを扱うためのカスタムフック
 *
 * @returns DailyUserOption関連の関数群
 */
export const useDailyOptionService = () => {
  // Firestoreの'daily_user_options'コレクションを操作するためのサービス
  const dailyOptionService = useFirestoreGeneral('daily_user_options')

  /**
   * 特定のユーザーの日別ステータスを取得します。
   * @param uid ユーザーID
   * @param date 日付 (YYYY-MM-DD)
   * @returns 取得したDailyUserOption、または存在しない場合はnull
   */
  const getDailyOption = async (uid: string, date: string): Promise<DailyUserOption | null> => {
    try {
      const options = await dailyOptionService.getListAsync(
        where('uid', '==', uid),
        where('date', '==', date)
      )
      // 制約上、データは1つか0のため最初の要素を返す
      return options.length > 0 ? (options[0] as DailyUserOption) : null
    } catch (error) {
      console.error(`Failed to get daily option for UID: ${uid} on date: ${date}`, error)
      throw error
    }
  }

  /**
   * 指定期間内における日別ステータスのリストを取得します。
   * @param uid ユーザーID
   * @param startDate 開始日 (YYYY-MM-DD)
   * @param endDate 終了日 (YYYY-MM-DD)
   * @returns DailyUserOptionの配列
   */
  const getDailyOptionsInRange = async (startDate: string, endDate: string): Promise<DailyUserOption[]> => {
    try {
      const options = await dailyOptionService.getListAsync(
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )
      return options as DailyUserOption[]
    } catch (error) {
      console.error(`Failed to get daily options in range`, error)
      throw error
    }
  }

  /**
   * 特定のユーザーの指定期間内における日別ステータスのリストを取得します。
   * @param uid ユーザーID
   * @param startDate 開始日 (YYYY-MM-DD)
   * @param endDate 終了日 (YYYY-MM-DD)
   * @returns DailyUserOptionの配列
   */
  const getDailyUserOptionsInRange = async (uid: string, startDate: string, endDate: string): Promise<DailyUserOption[]> => {
    try {
      const options = await dailyOptionService.getListAsync(
        where('uid', '==', uid),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )
      return options as DailyUserOption[]
    } catch (error) {
      console.error(`Failed to get daily options in range for UID: ${uid}`, error)
      throw error
    }
  }

  /**
   * ユーザーの日別ステータスを作成または更新します (Upsert)。
   * 指定されたユーザーと日付のデータが既に存在する場合は更新し、存在しない場合は新規作成します。
   * これにより、「ユーザーごとに同日には1つのデータしか持たない」という制約を担保します。
   *
   * @param optionData - 保存するDailyUserOptionのデータ (idは不要)
   * @returns 保存されたドキュメントのID
   */
  const setDailyOption = async (optionData: Omit<DailyUserOption, 'id'>): Promise<string> => {
    try {
      const existingOption = await getDailyOption(optionData.uid, optionData.date)

      if (existingOption?.id) {
        // 既存データがあれば更新
        await dailyOptionService.updateAsync(existingOption.id, optionData)
        return existingOption.id
      } else {
        // 既存データがなければ新規作成
        const newDoc = await dailyOptionService.addAsync(optionData)
        if (!newDoc?.id) {
          throw new Error('Failed to create new daily option.')
        }
        return newDoc.id
      }
    } catch (error) {
      console.error('Failed to set daily option:', error)
      throw error
    }
  }

  /**
   * 特定のユーザーの日別ステータスを削除します。
   * @param uid ユーザーID
   * @param date 日付 (YYYY-MM-DD)
   * @returns 削除が成功したかどうか
   */
  const deleteDailyOption = async (uid: string, date: string): Promise<boolean> => {
    try {
        const existingOption = await getDailyOption(uid, date);
        if (existingOption?.id) {
            await dailyOptionService.deleteAsync(existingOption.id);
            return true;
        }
        // 削除対象が存在しない場合も成功とみなす
        return true;
    } catch (error) {
        console.error(`Failed to delete daily option for UID: ${uid} on date: ${date}`, error);
        throw error;
    }
  }

  return {
    getDailyOption,
    getDailyOptionsInRange,
    getDailyUserOptionsInRange,
    setDailyOption,
    deleteDailyOption
  }
}