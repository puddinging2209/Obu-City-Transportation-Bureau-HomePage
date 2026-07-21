import React from 'react';
import Marquee from 'react-fast-marquee';

export default function OverflowMarquee({ children, speed = 30, delay = 1, className, style }) {
	const boxRef = React.useRef(null);
	const measureRef = React.useRef(null);
	const [overflow, setOverflow] = React.useState(false);

	React.useLayoutEffect(() => {
		if (!boxRef.current || !measureRef.current) return;

		const boxWidth = boxRef.current.clientWidth;
		const textWidth = measureRef.current.scrollWidth;

		setOverflow(textWidth > boxWidth);
	}, [children]); // 依存配列を children に変更

	return (
		<div
			ref={boxRef}
			className={className} // 外部からのクラス定義に対応
			style={{
				width: '100%',
				fontSize: '0.8em', // 必要に応じてデフォルト値。外部から style が来たら上書きされます
				overflow: 'hidden',
				whiteSpace: 'nowrap',
				position: 'relative',
				...style, // 外部からのスタイル定義に対応
			}}
		>
			{/* 幅計測専用（親の文字サイズや太字の設定を引き継ぐ） */}
			<div
				ref={measureRef}
				style={{
					position: 'absolute',
					visibility: 'hidden',
					whiteSpace: 'nowrap',
					pointerEvents: 'none',
					display: 'inline-block',
				}}
			>
				{children}
			</div>

			{/* 表示部分 */}
			{overflow ?
				<Marquee speed={speed} gradient={false} pauseOnHover delay={delay}>
					<span style={{ paddingRight: 30, display: 'inline-block' }}>{children}</span>
				</Marquee>
			:	children}
		</div>
	);
}
