import lines from '../lines.json';
import {
  SwipeableDrawer,
  List,
  ListItemButton,
  ListItemText,
  Radio,
  Typography,
  Box,
} from '@mui/material';

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
                primary={`${lines[o.value.route]?.show ?? o.value.route} ${o.label}`}
                primaryTypographyProps={{
                  fontWeight: selected ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </SwipeableDrawer>
  );
}
