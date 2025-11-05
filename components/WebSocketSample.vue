<script setup lang="ts">
import { useWebSocket } from '~/composables/useWebSocket';

// 独自の通知サーバーのWebSocketエンドポイント
const WS_URL = 'ws://localhost:3001'; 

const { isConnected, latestNotification } = useWebSocket(WS_URL);

// 過去の通知を保持するための配列
const notifications = ref<FileUpdateNotification[]>([]);

// 最新の通知が更新されるたびに配列に追加
watch(latestNotification, (newNotification) => {
    if (newNotification) {
        // 新しい通知を配列の先頭に追加
        notifications.value.unshift(newNotification);
        // 通知が多すぎる場合は古いものを削除
        if (notifications.value.length > 10) {
            notifications.value.pop();
        }
    }
}, { deep: true });
</script>

<template>
    <div class="container">
        <h1>☁️ GCSファイル更新リアルタイム通知</h1>
        <p>
            WebSocketステータス: 
            <span :style="{ color: isConnected ? 'green' : 'red', fontWeight: 'bold' }">
                {{ isConnected ? '接続中 (ON)' : '切断中 (OFF)' }}
            </span>
        </p>
        
        <hr>

        <h2>🔔 最新の通知</h2>
        <div v-if="latestNotification" class="notification-card">
            <p><strong>ファイル名:</strong> {{ latestNotification.fileName }}</p>
            <p><strong>イベントタイプ:</strong> {{ latestNotification.eventType }}</p>
            <p><strong>タイムスタンプ:</strong> {{ new Date(latestNotification.timestamp).toLocaleTimeString() }}</p>
        </div>
        <p v-else>まだ通知はありません。</p>

        <hr>

        <h2>過去の通知履歴 (直近10件)</h2>
        <ul>
            <li v-for="n in notifications" :key="n.timestamp + n.fileName">
                <strong>[{{ n.eventType }}]</strong> {{ n.fileName }} ({{ new Date(n.timestamp).toLocaleTimeString() }})
            </li>
        </ul>
    </div>
</template>