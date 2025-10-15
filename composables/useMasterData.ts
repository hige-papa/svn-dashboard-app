// マスタ名とAPIのパスを対応させるオブジェクト
const masterApiPaths = {
  'own-company': '/api-mocks/own-company.json',
} as const;

// 有効なマスタ名を型として定義
export type MasterName = keyof typeof masterApiPaths;

/**
 * 汎用的なマスタデータ管理用Composable
 * @param masterName 取得したいマスタデータの名前
 * @returns 読み取り専用のマスタデータ (Ref)
 */
export const useMasterData = <T>(masterName: MasterName) => {
  // useStateを使い、アプリケーション全体で状態を共有する
  // キーを 'master-prefecture' のように一意にすることで、マスタごとに状態を管理
  // 初期値を null にしておき、未取得状態を判定する
  const data = useState<T[] | null>(`master-${masterName}`);

  // データがまだ取得されていない場合（初回呼び出し時）のみ実行
  if (data.value === undefined) {
    // APIパスを取得
    const path = masterApiPaths[masterName];
    
    // 他のコンポーネントからの同時呼び出しで複数回APIが呼ばれるのを防ぐため、
    // まず空配列をセットして「ロード中」の状態にする
    data.value = [];

    // Nuxt3標準の$fetchを使用してデータを取得
    // $fetchはクライアント・サーバーサイド両方で動作する
    $fetch<T[]>(path)
      .then(masterData => {
        // 取得したデータをセット
        data.value = masterData;
      })
      .catch(error => {
        // エラーハンドリング
        console.error(`Failed to fetch master data [${masterName}]:`, error);
        // エラーが起きたらnullに戻すことで、再試行の余地を残すこともできる
        data.value = null; 
      });
  }

  // 外部からデータを書き換えられないよう、readonlyにして返すのが安全
  return {
    data: readonly(data) as Ref<T[] | null>,
  }
}