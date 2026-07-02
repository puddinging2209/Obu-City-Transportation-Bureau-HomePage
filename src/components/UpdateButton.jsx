import UpdateIcon from '@mui/icons-material/Update';
import { Button, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';

export default function UpdateButton() {
    const [showUpdate, setShowUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        let reg;
        navigator.serviceWorker.ready.then((r) => {
            reg = r;
            setRegistration(r);

            // 更新がreadyになったら表示
            reg.addEventListener('controllerchange', () => {
                setShowUpdate(false);
            });
        });

        // 定期的に更新をチェック（デフォルト24時間）
        const checkInterval = setInterval(
            () => {
                reg?.update();
            },
            60 * 60 * 1000,
        );

        // SW更新時のイベント
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[UpdateButton] New service worker activated');
            setShowUpdate(false);
            window.location.reload();
        });

        return () => clearInterval(checkInterval);
    }, []);

    useEffect(() => {
        if (!registration) return;

        // SWの更新がある場合
        const handleUpdate = () => {
            const waiting = registration.waiting;
            if (waiting) {
                setShowUpdate(true);
            }
        };

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', handleUpdate);
            }
        });

        handleUpdate();
    }, [registration]);

    const handleUpdate = () => {
        if (registration?.waiting) {
            setIsUpdating(true);
            // 新しいSWにメッセージを送信
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    if (!showUpdate) return null;

    return (
        <Button
            variant='contained'
            color='primary'
            startIcon={isUpdating ? <CircularProgress size={24} /> : <UpdateIcon />}
            onClick={handleUpdate}
            disabled={isUpdating}
            size='small'
        >
            {isUpdating ? '更新中...' : '更新可能'}
        </Button>
    );
}
