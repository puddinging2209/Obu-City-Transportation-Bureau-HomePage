import { IconLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { createTheme } from '@mui/material';
import linesData from '../../../data/lines.json';
import typesData from '../../../data/types.json';
import { dia } from '../.././../utils/readOud';
import { TrainInfo } from '../components/TrainInfo';
import { setBottomSheetComponentAtom, setBottomSheetTitleAtom } from '../states/sheet';
import TrainMapWorker from '../trainMapWorker?worker';

const theme = createTheme();

function checkIsMobile() {
	if (typeof window === 'undefined') return false;

	const query = theme.breakpoints.down('sm');

	return window.matchMedia(query.replace(/^@media\s*/, '')).matches;
}

export async function initializeTrainsLayer({ map, store, onSelectTrain, onUpdateActiveTrain }) {
	const showTrainInfo = (train) => {
		store.set(setBottomSheetComponentAtom, TrainInfo, { train });
		store.set(setBottomSheetTitleAtom, '列車情報');
	};

	const isMobile = checkIsMobile();

	const worker = new TrainMapWorker();
	const ouds = await Promise.all(
		new Set(
			Object.values(linesData)
				.filter((e) => e.json && e.stations)
				.map((e) => e.json),
		)
			.values()
			.map(async (id) => {
				return dia(id);
			}),
	);
	worker.postMessage({
		type: 'setOuds',
		ouds,
	});

	const trainOverlay = new MapboxOverlay({
		interleaved: true,
		layers: [],
	});
	map.addControl(trainOverlay);

	let visible = true;

	worker.addEventListener('message', ({ data }) => {
		switch (data.type) {
			case 'calcPositionResult': {
				const trains = data.data.filter((t) => t.coordinate);
				const points = trains.map((t) => ({
					id: t.number,
					type: t.type,
					position: t.coordinate.reverse(),
					angle: t.angle,
				}));

				// ★【追加】現在ポップアップ表示対象の列車があれば、最新の座標をReact側に通知する
				if (onUpdateActiveTrain) {
					onUpdateActiveTrain({ points, trains, sec: data.sec });
				}

				const layer = new IconLayer({
					id: 'trains',
					data: points,
					pickable: true,

					iconAtlas: './icons/triangle.svg',
					iconMapping: Object.fromEntries(
						Object.values(typesData).map((t, i) => [
							t.name,
							{
								x: i * 100,
								y: 0,
								width: 100,
								height: 100,
							},
						]),
					),
					getIcon: (d) => d.type,
					getPosition: (d) => d.position,
					getColor: (d) => d.color,
					getAngle: (d) => d.angle,
					getSize: () => (isMobile ? 30 : 26),
					billboard: false,

					updateTriggers: {
						getPosition: data.sec,
					},
					onClick: (e) => {
						const train = data.data.find((t) => t.number === e.object?.id);
						if (train) {
							// showTrainInfo(train);

							// ★【追加】クリックされた列車の情報をReactのStateへ渡す
							onSelectTrain({
								sec: data.sec,
								id: e.object.id,
								position: e.object.position,
								rawTrainData: train, // ★ ボタンを押した時にボトムシートへ渡せるよう、元データを保持
							});
							console.log(train);
						}
					},
				});
				trainOverlay.setProps({
					layers: visible ? [layer] : [],
				});
				break;
			}
		}
	});

	return {
		id: 'trains',
		name: '列車',
		defaultEnabled: true,
		enable() {
			visible = true;
		},
		disable() {
			visible = false;
			trainOverlay.setProps({ layers: [] });
		},
		update(sec) {
			if (!visible) return;
			worker.postMessage({
				type: 'calcPosition',
				sec,
			});
		},
	};
}
