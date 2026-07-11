import React from 'react';

import { atom, useAtom } from 'jotai';

import TransferInput from '../components/TransferInput.jsx';
import TransferOutput from '../components/TransferOutput.jsx';

import { dijkstra } from '../utils/findRoute.js';
import { adjustTime } from '../utils/Time.js';

export const resultAtom = atom([]);

function Transfer() {
	const [result, setResult] = useAtom(resultAtom);
	const [loading, setLoading] = React.useState(false);

	async function searchTransfer(from, to, time, mode, transferTime, tokkyu, allowOuterTransfer) {
		if (!from || !to) return;
		setLoading(true);
		try {
			const segments = await dijkstra(from, to, adjustTime(time), mode, transferTime - 1, tokkyu, allowOuterTransfer);
			setResult(segments ?? []);
			console.log(segments);
		} catch (error) {
			alert(`エラーが発生しました: ${error.message}`);
			console.error(error);
			setResult([]);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<TransferInput loading={loading} onSearch={searchTransfer} />
			<TransferOutput result={result} />
		</>
	);
}

export default Transfer;
