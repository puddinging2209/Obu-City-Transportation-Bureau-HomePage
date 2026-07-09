import UpdateIcon from '@mui/icons-material/Update';
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useEffect, useState } from 'react';

export default function UpdateButton() {
	const [showUpdate, setShowUpdate] = useState(false);
	const [registration, setRegistration] = useState(null);
	const [showOudUpdate, setShowOudUpdate] = useState(false);
	const [oudManifest, setOudManifest] = useState(null);

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

		// SW からのメッセージを監視（OUD manifest 更新通知など）
		const onMessage = (ev) => {
			if (!ev.data) return;
			if (ev.data.type === 'OUD_MANIFEST_UPDATED') {
				setOudManifest(ev.data.manifest);
				setShowOudUpdate(true);
			}
		};
		navigator.serviceWorker.addEventListener('message', onMessage);

		return () => {
			clearInterval(checkInterval);
			navigator.serviceWorker.removeEventListener('message', onMessage);
		};
	}, []);

	// OUD 更新を実行する
	const handleOudUpdate = async () => {
		if (!oudManifest) return;
		if (!navigator.serviceWorker.controller) return;

		const msgChannel = new MessageChannel();
		msgChannel.port1.onmessage = (ev) => {
			if (ev.data && ev.data.success) {
				setShowOudUpdate(false);
				// 更新後はページリロードして新しいデータを反映
				window.location.reload();
			} else {
				console.warn('[UpdateButton] OUD update failed', ev.data);
			}
		};

		navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_OUD_CACHE', manifest: oudManifest }, [msgChannel.port2]);
	};

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
			// 新しいSWにメッセージを送信
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
	};

	return (
		<>
			{showUpdate && (
				<Dialog open={true}>
					<DialogTitle>新しいアップデートがあります</DialogTitle>
					<DialogContent>
						<Button variant='contained' color='primary' startIcon={<UpdateIcon />} onClick={handleUpdate} size='small'>
							更新
						</Button>
					</DialogContent>
				</Dialog>
			)}

			{showOudUpdate && (
				<Dialog open={true} onClose={() => setShowOudUpdate(false)}>
					<DialogTitle>データ更新があります</DialogTitle>
					<DialogContent>
						<div>運行データ（OUD）が更新されました。キャッシュを更新しますか？</div>
						<Button variant='contained' color='primary' startIcon={<UpdateIcon />} onClick={handleOudUpdate} size='small'>
							更新して反映
						</Button>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
