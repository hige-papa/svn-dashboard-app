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
    
    // パラメータ化クエリでデータを取得（指定カラムのみ）
    const result = await pool.request()
      .query(`
        SELECT TOP (100) 
          [請求NO],
          [名前],
          [ふり],
          [性],
          [郵便],
          [住所01],
          [住所02],
          [TEL]
        FROM [dbo].[DB基本情報] 
        ORDER BY [請求NO] ASC
      `);
    
    console.log(`データ取得成功: ${result.recordset.length}件`);
    
    // カラム名を確認
    if (result.recordset.length > 0) {
      console.log('利用可能なカラム名:', Object.keys(result.recordset[0]));
    }
    
    // 接続を閉じる
    await pool.close();
    
    return {
      success: true,
      data: result.recordset,
      count: result.recordset.length
    };
  } catch (error: any) {
    console.error('SQL Server接続エラー詳細:', {
      message: error?.message,
      code: error?.code,
      serverName: error?.serverName,
      name: error?.name
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
      userMessage = 'テーブルが見つかりません';
      troubleshooting = 'テーブル名[DB基本情報]の存在を確認してください';
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
        user: config.user
      }
    });
  }
});
