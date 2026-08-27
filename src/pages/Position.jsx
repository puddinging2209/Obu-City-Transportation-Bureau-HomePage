import React from 'react';

import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Position() {
	const navigate = useNavigate();
	React.useEffect(() => {
		navigate('/map');
	}, []);
	return <Typography variant='h6'>準備中...</Typography>;
}

export default Position;
