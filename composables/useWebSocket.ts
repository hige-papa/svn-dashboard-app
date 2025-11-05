// composables/useWebSocket.ts
import { ref, onMounted, onUnmounted } from 'vue';

// 通知ペイロードの型を定義
export interface FileUpdateNotification {
    type: 'FILE_UPDATE';
    fileName: string;
    eventType: string; // 例: FINALIZED, DELETE
    timestamp: string;
}

export function useWebSocket(url: string) {
    const isConnected = ref(false);
    const latestNotification = ref<FileUpdateNotification | null>(null);
    let ws: WebSocket | null = null;

    const connect = () => {
        if (ws) return; // 既に接続済みなら何もしない

        ws = new WebSocket(url);

        ws.onopen = () => {
            isConnected.value = true;
            console.log('WebSocket: 接続成功');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as FileUpdateNotification;
                latestNotification.value = data;
                console.log('WebSocket: 新しい通知を受信', data);
            } catch (error) {
                console.error('WebSocket: メッセージの解析エラー', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket: エラー', error);
        };

        ws.onclose = () => {
            isConnected.value = false;
            ws = null;
            console.log('WebSocket: 接続切断');
            // 必要に応じて再接続ロジックをここに記述
            // setTimeout(connect, 5000); 
        };
    };

    const disconnect = () => {
        if (ws) {
            ws.close();
            ws = null;
        }
    };

    onMounted(connect);
    onUnmounted(disconnect);

    return {
        isConnected,
        latestNotification,
        connect,
        disconnect,
    };
}