// Firestoreに保存されているEventドキュメントのデータ構造
interface EventData {
    id?: string;
    title: string;
    date: string; // YYYY-MM-DD
    startDate: string; // for range/recurring events
    endDate: string; // for range events
    recurringStartDate: string; // for recurring events
    startTime: string;
    endTime: string;
    location?: string;
    description?: string;
    priority: number;
    participantIds: string[];
    facilityIds?: string[];
    equipmentIds?: string[];
    
    // イベント種別関連
    eventType: 'meeting' | 'focus' | 'away' | 'other' | 'vacation' | 'normal';
    eventTypeName: string; // イベント種別の名称
    eventTypeColor: string; // イベント種別の色
    
    // プライベート設定
    private: boolean;

    // 繰り返し設定
    dateType: 'single' | 'range' | 'recurring';
    recurrenceRuleId?: string; // 繰り返しルールのID
    // その他のFirestoreフィールド
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}

// クライアント側でカレンダー表示のために使用するイベントデータ構造
// EventDataをベースに、クライアント側の表示に必要なフィールドを追加する
interface EventDisplay {
    id: string; // ドキュメントID
    title: string;
    date: string; // 実際に表示する日付 (YYYY-MM-DD)
    startTime: string;
    endTime: string;
    priority: number;
    participantIds: string[];
    
    eventTypeName: string;
    eventTypeColor: string;
    private: boolean;

    // クライアント側で計算・表示に使用する追加フィールド
    isMultiDay: boolean;
    segmentId: string; // 繰り返し/複数日イベントで、元イベントとの紐付けに使用
    conflicted: boolean; // 競合しているか
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as moment from 'moment-timezone';
import { Timestamp } from 'firebase-admin/firestore';

// Firestoreからデータを読み取るための管理SDKを初期化
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// --- 定数 ---
const TIME_ZONE = 'Asia/Tokyo'; // 処理を実行するタイムゾーン
// const BUCKET_NAME = process.env.GCLOUD_STORAGE_BUCKET || `${process.env.GCP_PROJECT}.appspot.com`;
const CACHE_FOLDER = 'calendar-cache';

/**
 * イベントデータを集約し、週別のキャッシュファイル名（Key）を生成する
 * Keyフォーマット: [YYYY]-[W]-cache.json (WはISO週番号)
 * 隔週の場合は、Wを偶数または奇数に丸めるなどのロジックが必要だが、
 * ここではシンプルにISO週番号を使用し、クライアント側で処理を最適化することを推奨
 * * @param dateStr イベントの日付 'YYYY-MM-DD'
 * @returns 該当週のキャッシュキー 'YYYY-WW' (ISO Week Date)
 */
const getCacheKeyForDate = (dateStr: string): string => {
    // momentで日付をパースし、指定タイムゾーンで処理
    const date = moment.tz(dateStr, TIME_ZONE);
    // ISO 8601 形式の週番号を取得 (WW)
    const year = date.isoWeekYear();
    const week = date.isoWeek().toString().padStart(2, '0');
    return `${year}-${week}`;
}

/**
 * 指定された週の範囲を計算する
 * @param cacheKey 'YYYY-WW'
 * @returns {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
 */
const getDateRangeForCacheKey = (cacheKey: string): { startDate: string, endDate: string } => {
    const [year, week] = cacheKey.split('-').map(Number);
    // 週の最初（月曜）と最後（日曜）を計算
    const startOfWeek = moment.tz(TIME_ZONE).year(year).isoWeek(week).startOf('isoWeek');
    const endOfWeek = moment.tz(TIME_ZONE).year(year).isoWeek(week).endOf('isoWeek');
    
    return {
        startDate: startOfWeek.format('YYYY-MM-DD'),
        endDate: endOfWeek.format('YYYY-MM-DD')
    };
}

/**
 * 指定された日付範囲内の全イベントを取得し、キャッシュデータ構造に変換する
 */
const generateCacheData = async (startDate: string, endDate: string) => {
    functions.logger.info(`Generating cache from ${startDate} to ${endDate}`);
    
    // Firestoreから日付範囲内の全イベントを取得
    const snapshot = await db.collection('events')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();

    const events: EventDisplay[] = [];
    snapshot.docs.forEach(doc => {
        const data = doc.data() as EventDisplay;

        // そのまま追加する
        // events.push(data as EventDisplay);
        
        // クライアントで必要な EventDisplay 形式に変換
        const eventDisplay: Partial<EventDisplay> = {
            ...data,
            ...{
                id: doc.id,
                createdAt: (data.createdAt as Timestamp)?.toDate().toLocaleString(),
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toLocaleString()
            }
        };
        events.push(eventDisplay as EventDisplay);
    });

    // キャッシュデータ構造を定義 (週次ビューに必要な情報をここに含める)
    const cacheData = {
        generatedAt: admin.firestore.Timestamp.now().toDate().toISOString(),
        startDate: startDate,
        endDate: endDate,
        eventsCount: events.length,
        events: events.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
        // 施設/備品の利用状況のサマリーなどをここに追加可能
    };

    return cacheData;
}

/**
 * 生成したデータをCloud StorageにJSONファイルとして書き込む
 */
const uploadCacheFile = async (cacheKey: string, data: any): Promise<string> => {
    // BUCKET_NAME の定義を使用せず、admin.storage().bucket() を使用
    // これにより、デフォルトのStorageバケット (tascal-app-a344b.appspot.com) を安全に参照できます
    const bucket = storage.bucket(); 
    
    const filePath = `${CACHE_FOLDER}/${cacheKey}-cache.json`;
    const file = bucket.file(filePath); // <-- 修正箇所

    const jsonString = JSON.stringify(data, null, 2);
    
    await file.save(jsonString, {
        contentType: 'application/json',
        metadata: {
            cacheControl: 'public, max-age=3600, must-revalidate' 
        }
    });
    functions.logger.info(`Cache file uploaded successfully to gs://${bucket.name}/${filePath}`); // <-- ログ出力も修正
    return filePath;
}

// --- ★★★ 新規追加: 初期移行用バッチ Functions ★★★
/**
 * 既存の全イベントを走査し、週ごとのキャッシュファイルを一括で生成する
 * (HTTPトリガーとして、運用開始時に一度だけ手動で実行することを想定)
 */
export const initialCacheGeneration = functions.region('asia-northeast1')
    .runWith({ timeoutSeconds: 300, memory: '1GB' }) // 大量データ処理のため設定を増強
    .https.onRequest(async (req, res) => {
        // 🚨 運用上のセキュリティ確保:
        // 実際の運用では、認証チェックやシークレットキーの検証を追加して、
        // 開発者または承認されたユーザーのみが実行できるようにしてください。
        
        functions.logger.info("Starting initial cache generation for all existing events.");

        try {
            // 1. 全イベントから、データが存在する全ての週キーを収集する
            const allEventsSnapshot = await db.collection('events').select('date').get(); // dateフィールドのみを取得
            const cacheKeys = new Set<string>();

            allEventsSnapshot.docs.forEach(doc => {
                const data = doc.data() as Partial<EventData>;
                if (data.date) {
                    // イベントの開始日をキーとして使用
                    cacheKeys.add(getCacheKeyForDate(data.date));
                }
            });
            const keysArray = Array.from(cacheKeys);
            functions.logger.info(`Found ${keysArray.length} distinct weeks to process.`);
            
            // 2. 収集した全週キーに対してキャッシュを生成・アップロード (並列処理)
            const promises = keysArray.map(async (key) => {
                const { startDate, endDate } = getDateRangeForCacheKey(key);
                const cacheData = await generateCacheData(startDate, endDate);
                await uploadCacheFile(key, cacheData);
                return key;
            });

            const completedKeys = await Promise.all(promises);

            res.status(200).send({
                status: "SUCCESS",
                message: `${completedKeys.length} weekly cache files generated successfully for existing data.`,
                weeksGenerated: completedKeys,
            });
        } catch (error) {
            functions.logger.error("Initial cache generation failed:", error);
            res.status(500).send({
                status: "ERROR",
                message: "Initial cache generation failed.",
                error: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        }
    });

// --- Firestore トリガー ---

/**
 * イベントの作成、更新、削除時にキャッシュファイルを再生成する
 * トリガーは一つの関数にまとめることで、イベントがどの操作で変更されても対応できる
 */
export const onEventChangeRecalculateCache = functions.region('asia-northeast1')
    .firestore.document('events/{eventId}')
    .onWrite(async (change, context) => {
        const beforeData = change.before.data() as EventData | undefined;
        const afterData = change.after.data() as EventData | undefined;

        // 変更されたイベントの日付を取得
        const changedDate = afterData?.date || beforeData?.date;
        if (!changedDate) {
            functions.logger.warn("Event data is missing date field. Skipping cache regeneration.");
            return null;
        }

        // 該当週のキャッシュキーを計算
        const cacheKey = getCacheKeyForDate(changedDate);
        
        // キャッシュキーに対応する日付範囲を取得
        const { startDate, endDate } = getDateRangeForCacheKey(cacheKey);

        functions.logger.info(`Triggered by event change on ${changedDate}. Target cache key: ${cacheKey}`);

        // 1. キャッシュデータを再生成
        const cacheData = await generateCacheData(startDate, endDate);
        
        // 2. Cloud Storageにアップロード
        await uploadCacheFile(cacheKey, cacheData);

        return null;
    });