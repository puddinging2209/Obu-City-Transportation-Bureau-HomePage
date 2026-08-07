import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { layersEnabledAtom, updateLayerEnabledAtom } from '../states/layers';

export function LayersControl({ layers }) {
	const layersEnabled = useAtomValue(layersEnabledAtom)
	const updateLayerEnabled = useSetAtom(updateLayerEnabledAtom)

	return (
		<Stack gap={1}>
			{
				layers.map((l) => (
					<FormControlLabel
						key={l.id}
						label={l.name}
						control={
							<Checkbox
								checked={layersEnabled[l.id] ?? false}
							></Checkbox>
						}
						onChange={e => {
							updateLayerEnabled(l.id, e.target.checked)
							e.target.checked ? l.enable() : l.disable()
						}}
					></FormControlLabel>
				))
			}
		</Stack>
	)
}
