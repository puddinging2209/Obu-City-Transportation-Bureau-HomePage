import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';

export const bottomSheetContent = atomWithReset({
	component: null,
	props: {},
	title: '',
});

export const isBottomSheetOpenAtom = atom((get) => !!get(bottomSheetContent).component);

export const setBottomSheetComponentAtom = atom(null, (get, set, component, props) => {
	set(bottomSheetContent, { ...get(bottomSheetContent), component, props });
});

export const setBottomSheetTitleAtom = atom(null, (get, set, title) => {
	set(bottomSheetContent, { ...get(bottomSheetContent), title });
});

export const clearBottomSheetAtom = atom(null, (get, set) => set(bottomSheetContent, RESET));

export const trackingTrainAtom = atom({
	number: null,
	coordinates: [],
});
