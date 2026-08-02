import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import { useAtom } from 'jotai';
import { layersEnabledAtom } from '../states/layers';

export function LayersControl({ layers }) {
	const [layersEnabled, setLayersEnabled] = useAtom(layersEnabledAtom)

	return (
		<Stack>
			{
				layers.map((l, i) => (
					<FormControlLabel
						key={i}
						label={l.name}
						control={
							<Checkbox
								checked={layersEnabled[i] ?? false}
							></Checkbox>
						}
						onChange={e => {
							setLayersEnabled(layersEnabled.with(i, e.target.checked))
							e.target.checked ? l.enable() : l.disable()
						}}
					></FormControlLabel>
				))
			}
		</Stack>
	)
}
