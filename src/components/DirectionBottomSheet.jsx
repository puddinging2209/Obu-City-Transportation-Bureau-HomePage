import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    Radio,
    SwipeableDrawer,
    Typography,
} from '@mui/material';
import lines from '../../public/data/lines.json';

export default function DirectionBottomSheet({
  open,
  onClose,
  options,
  value,
  onSelect,
}) {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableDiscovery
      disableScrollLock
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          pb: 2,
        },
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          方面を選択
        </Typography>
      </Box>

      <List>
        {options.map(o => {
          const selected =
            o.value.route === value?.route &&
            o.value.stationName === value?.stationName;

          return (
            <ListItemButton
              key={`${o.value.route}-${o.value.stationName}`}
              onClick={() => {
                onSelect(o.value);
              }}
            >
              <Radio checked={selected} />

            <ListItemText
                disableTypography
                primary={
                    <>
                        <Typography variant='subtitle1' sx={{ mt: 0, fontWeight: selected ? 'bold' : 'normal' }}>{o.label}</Typography>
                        <Typography sx={{ mt: 0, fontWeight: selected ? 'bold' : 'normal' }} variant='body2'>{lines[o.value.route]?.show ?? o.value.route}</Typography>
                    </>
                }
              />
            </ListItemButton>
          );
        })}
      </List>
    </SwipeableDrawer>
  );
}
