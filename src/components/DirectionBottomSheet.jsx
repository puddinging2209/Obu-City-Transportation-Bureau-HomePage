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
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          pb: 2,
        },
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          方面を選択
        </Typography>
      </Box>

      {/* 選択肢 */}
      <List>
        {options.map(o => {
          const selected = o.value === value;

          return (
            <ListItemButton
              key={o.value}
              onClick={() => {
                onSelect(o.value);
                onClose();
              }}
            >
              <Radio
                checked={selected}
                tabIndex={-1}
                value={o.value}
                color="primary"
              />

              <ListItemText
                primary={`${lines[o.route]?.show ?? o.route} ${o.label}`}
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