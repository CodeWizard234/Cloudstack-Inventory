import React, { useEffect, useState } from 'react';

const TypewriterText = ({ text, className = '', speed = 28, startDelay = 0, cursor = true, onComplete }) => {
  const [visibleText, setVisibleText] = useState('');

  useEffect(() => {
    let index = 0;
    let intervalId;
    let timeoutId;

    const startTyping = () => {
      intervalId = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));

        if (index >= text.length) {
          window.clearInterval(intervalId);
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }
      }, speed);
    };

    if (startDelay > 0) {
      timeoutId = window.setTimeout(startTyping, startDelay);
    } else {
      startTyping();
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [text, speed, startDelay, onComplete]);

  return (
    <span className={className}>
      {visibleText}
      {cursor && <span className="inline-block ml-1 w-[0.08em] animate-pulse align-baseline">|</span>}
    </span>
  );
};

export default TypewriterText;
