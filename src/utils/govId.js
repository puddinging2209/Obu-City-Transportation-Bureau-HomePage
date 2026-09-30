import { createLocalGovClient } from '@b4moss/jp-local-gov-id';
import { useEffect, useState } from 'react';

const dataUrl = 'https://cdn.jsdelivr.net/npm/@b4moss/jp-local-gov-id-data@1.0.0/index.json';
let clientPromise;

export function getLocalGovClient() {
	clientPromise ??= createLocalGovClient({ url: dataUrl });
	return clientPromise;
}

export async function getLocalGovByCode(code) {
	const client = await getLocalGovClient();
	if (/^\d{2}$/.test(code)) return client.getPrefectureByCode(code);
	if (/^\d{6}$/.test(code)) return client.getMunicipalityByCode(code);
	return null;
}

export function useLocalGov() {
	const [client, setClient] = useState(null);

	useEffect(() => {
		let active = true;
		getLocalGovClient()
			.then((instance) => {
				if (active) setClient(instance);
			})
			.catch((error) => console.error('Failed to load municipality data', error));
		return () => {
			active = false;
		};
	}, []);

	return client;
}
