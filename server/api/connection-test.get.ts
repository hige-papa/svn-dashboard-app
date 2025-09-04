// server/api/connection-test.get.ts
import sql from 'mssql';

// SQL Server認証を使用した接続設定
const config = {
  server: process.env.SQLSERVER_HOST || 'COTA-NA-NOTE',
  database: process.env.SQLSERVER_DATABASE || 'SampleDb',
  user: process.env.SQLSERVER_USER || 'svn',
  password: process.env.SQLSERVER_PASSWORD || 'svn-256256',
  driver: 'msnodesqlv8',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 60000,
  requestTimeout: 30000,
};

export default defineEventHandler(async (event) => {
  console.log('SQL Server接続試行中...', {
    server: config.server,
    database: config.database,
    user: config.user,
    driver: config.driver
  });

  try {
    // クエリパラメータを取得
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 100;
    const offset = (page - 1) * limit;
    const dataSource = (query.dataSource as string) || 'table';
    const minValue = query.minValue ? parseInt(query.minValue as string) : null;
    const maxValue = query.maxValue ? parseInt(query.maxValue as string) : null;

    console.log('リクエストパラメータ:', { page, limit, offset, dataSource, minValue, maxValue });

    // データベースに接続
    console.log('接続設定:', {
      server: config.server,
      database: config.database,
      user: config.user,
      driver: config.driver,
      options: config.options
    });
    
    const pool = await sql.connect(config);
    console.log('SQL Server接続成功');
    
    let result;
    let totalCount = 0;
    
    // データソースに応じて処理を分岐
    if (dataSource === 'sp') {
      // ストアドプロシージャを実行
      console.log('ストアドプロシージャ実行:', { minValue, maxValue });
      
      const spResult = await pool.request()
        .input('請求NOmin', sql.Int, minValue)
        .input('請求NOmax', sql.Int, maxValue)
        .execute('[dbo].[SP基本情報]');
      
      // 全結果から指定カラムのみ抽出
      const allData = spResult.recordset.map((row: any) => ({
        '請求NO': row['請求NO'],
        '名前': row['名前'],
        'ふり': row['ふり'],
        '性': row['性'],
        '郵便': row['郵便'],
        '住所01': row['住所01'],
        '住所02': row['住所02'],
        'TEL': row['TEL']
      }));
      
      totalCount = allData.length;
      
      // ページネーション適用
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const paginatedData = allData.slice(startIndex, endIndex);
      
      result = { recordset: paginatedData };
      
    } else {
      // Table または View の場合
      const tableName = dataSource === 'view' ? 'VW基本情報' : 'DB基本情報';
      console.log('テーブル/ビュー クエリ実行:', tableName);
      
      // 総件数を取得
      const countResult = await pool.request()
        .query(`SELECT COUNT(*) as total FROM [dbo].[${tableName}]`);
      totalCount = countResult.recordset[0].total;

      // パラメータ化クエリでデータを取得（指定カラムのみ、ページネーション対応）
      result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT 
            [請求NO],
            [名前],
            [ふり],
            [性],
            [郵便],
            [住所01],
            [住所02],
            [TEL]
          FROM [dbo].[${tableName}] 
          ORDER BY [請求NO] ASC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `);
    }
    
    console.log(`データ取得成功: ${result.recordset.length}件 (${page}ページ目, 総件数: ${totalCount}件, データソース: ${dataSource})`);
    
    // カラム名を確認
    if (result.recordset.length > 0) {
      console.log('利用可能なカラム名:', Object.keys(result.recordset[0]));
    }
    
    // 接続を閉じる
    await pool.close();
    
    return {
      success: true,
      data: result.recordset,
      count: result.recordset.length,
      totalCount: totalCount,
      page: page,
      limit: limit,
      hasMore: (page * limit) < totalCount,
      dataSource: dataSource
    };
  } catch (error: any) {
    console.error('SQL Server接続エラー詳細:', {
      message: error?.message,
      code: error?.code,
      serverName: error?.serverName,
      name: error?.name,
      stack: error?.stack
    });
    
    // エラーメッセージを詳細化
    let userMessage = 'データベース接続に失敗しました';
    let troubleshooting = '';
    
    if (error?.message?.includes('Could not connect')) {
      userMessage = 'SQL Serverに接続できません';
      troubleshooting = 'SQL Serverサービスとブラウザサービスの起動状況を確認してください';
    } else if (error?.message?.includes('Login failed') || error?.message?.includes('ログインできませんでした')) {
      userMessage = 'データベースへのログインに失敗しました';
      troubleshooting = 'SQL認証ユーザー(svn)の存在とパスワードを確認してください';
    } else if (error?.message?.includes('Invalid object name')) {
      userMessage = 'テーブル・ビュー・ストアドプロシージャが見つかりません';
      troubleshooting = 'データソースの存在を確認してください';
    } else if (error?.message?.includes('Could not find stored procedure')) {
      userMessage = 'ストアドプロシージャが存在しません';
      troubleshooting = 'SP基本情報ストアドプロシージャの存在を確認してください';
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: userMessage,
      data: {
        message: `${userMessage}: ${error?.message || '不明なエラー'}`,
        troubleshooting,
        detailId: Date.now().toString(),
        serverAttempted: config.server,
        database: config.database,
        user: config.user,
        errorStack: error?.stack,
        dataSource: (getQuery(event).dataSource as string) || 'table'
      }
    });
  }
});
