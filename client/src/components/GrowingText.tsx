// external imports
import { useEffect, useRef } from 'react';

/*
returns html&css for provided text with maximum possible size before overflowing parentDiv

how to use:

  import React, { useRef } from 'react';

  function MyComponent() {
    const parentDiv = useRef(null);

    return (
      <div ref={parentDiv}>
        <GrowingText text="Hello, World!" parentDiv={parentDiv} />
      </div>
    )
  }

*/

interface GrowingTextProps {
  text: string;
  parentDiv: React.RefObject<HTMLDivElement> | React.RefObject<null>;
}

function GrowingText({ text, parentDiv }: GrowingTextProps) {
  
  const textRef = useRef<HTMLDivElement>(null);

  function adjustFontSize() {
    if (textRef.current && parentDiv.current) {
      let fontSize = 1.2;
      textRef.current.style.fontSize = `${fontSize}rem`;
      while (textRef.current.scrollHeight < parentDiv.current.scrollHeight) {
        fontSize += 0.1;
        textRef.current.style.fontSize = `${fontSize}rem`;
      }
      fontSize -= 0.1;
      textRef.current.style.fontSize = `${fontSize}rem`;
    }
  }

  useEffect(() => {
    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [text, parentDiv]);

  return (
    <h4 className="growingText" ref={textRef}>
      {text}
    </h4>
  );
}

export default GrowingText;