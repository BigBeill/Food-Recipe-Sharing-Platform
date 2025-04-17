import { useEffect, useRef } from 'react';
/* 
THIS FUNCTION IS NOT EFFICIENT RIGHT NOW
   I didn't realize offsetHeight/offsetWidth was a thing at the time of creating this and some code utilizes it and some doesn't.
   right now im of the mindset that if it works don't touch it while i work on other stuff,
   but i do intend to fix this in the near future.
*/

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
         while( textRef.current.scrollHeight > textRef.current.offsetHeight || textRef.current.scrollWidth > textRef.current.offsetWidth) {
            fontSize -= 0.1;
            textRef.current.style.fontSize = `${fontSize}rem`;
         }
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