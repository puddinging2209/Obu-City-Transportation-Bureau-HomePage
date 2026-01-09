import React from 'react';
import Marquee from 'react-fast-marquee';

export default function OverflowMarquee({
  text,
  speed = 30,
  delay = 1,
}) {
  const boxRef = React.useRef(null);
  const measureRef = React.useRef(null);
  const [overflow, setOverflow] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!boxRef.current || !measureRef.current) return;

    const boxWidth = boxRef.current.clientWidth;
    const textWidth = measureRef.current.scrollWidth;

    setOverflow(textWidth > boxWidth);
  }, [text]);

  return (
    <div
      ref={boxRef}
      style={{
        width: '100%',
        fontSize: '0.8em',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      {/* 幅計測専用（表示されない） */}
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>

      {/* 表示部分 */}
      {overflow ? (
        <Marquee
          speed={speed}
          gradient={false}
          pauseOnHover
          delay={delay}
        >
          <span style={{ paddingRight: 30 }}>
            {text}
          </span>
        </Marquee>
      ) : (
        text
      )}
    </div>
  );
}