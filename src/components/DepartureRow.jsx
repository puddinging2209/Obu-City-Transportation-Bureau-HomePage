import { Box, Chip, Grid, Typography } from '@mui/material';

import { name } from '../utils/Station.js';
import { toTimeString } from '../utils/Time.js';
import OverflowMarquee from './OverflowMarquee.jsx';

import types from '../../public/data/types.json';

function DepartureRow({ dep, needId = false }) {
  return (
    <Box
      id={needId ? String(dep.time) : null}
      sx={{
        borderBottom: '1px solid rgba(0,0,0,0.12)',
        py: '3px',
      }}
    >
      <Grid
        container
        wrap="nowrap"
        alignItems="center"
        columnGap={0.5}
      >
        {/* 種別 */}
        <Grid item sx={{ flex: '0 0 auto' }}>
          <Chip
            label={dep.typeName}
            size="small"
            sx={{
              background: types[dep.typeName].color,
              color: '#fff',
              fontSize: '0.75em',
              minWidth: '8.5em',
              px: 0.8,
            }}
          />
        </Grid>

        {/* 行先（残り全部） */}
        <Grid
          item
          sx={{
            textAlign: 'center',
            flex: '1 1 auto',
            minWidth: 0, // ← 超重要
          }}
        >
          <Box
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <OverflowMarquee text={name(dep.terminal)} />
          </Box>
        </Grid>

        {/* 時刻（固定） */}
        <Grid
          item
          sx={{
            flex: '0 0 42px',
            textAlign: 'right',
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {toTimeString(dep.time)}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DepartureRow;