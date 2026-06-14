import { Button } from '@mui/material';

import { importSaveData } from '../utils/logDataManager';

export default function SaveDataImportButton({ onLoadSuccess }) {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileText = e.target?.result;
            if (!fileText) return;

            // 改ざんチェック付きのインポート処理を実行
            const loadedData = importSaveData(fileText);

            if (loadedData) {
                // 成功したら親のステート（ゲームの状態）を更新
                onLoadSuccess(loadedData);
            }

            // 同じファイルを連続で選択してもイベントが発火するように値をリセット
            event.target.value = '';
        };

        reader.readAsText(file);
    };

    return (
        // component="label" を指定することで、ボタンをクリックすると内部のinputが発火します
        <Button component='label' variant='contained'>
            インポート
            <input
                type='file'
                accept='.obu' // 独自拡張子を指定
                hidden // 画面上には表示しない
                onChange={handleFileChange}
                dddddd
            />
        </Button>
    );
}
