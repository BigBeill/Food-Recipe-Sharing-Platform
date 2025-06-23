import { useState, useEffect } from 'react';

import '../styles/componentSpecific/notebook.scss';
import PageObject from '../interfaces/PageObject';
import PaginationBar from './PaginationBar';

// LOOK AT README.MD FILE IN THE ROOT FOLDER FOR INSTRUCTIONS ON HOW TO USE THIS COMPONENT

interface NotebookProps {
   pageList: PageObject[];
   parentPageNumber?: number;
   requestNewPage?: (pageNumber: number) => void;
   pageCount?: number;
}

export default function Notebook ({pageList, parentPageNumber = 1, requestNewPage, pageCount = pageList.length}: NotebookProps) {

   const [displayRight, setDisplayRight] = useState<boolean>(false);
   const [narrowScreen, setNarrowScreen] = useState<boolean>(false);

   const [currentIndex, setCurrentIndex] = useState<number>(0);

   useEffect(() => {
      // check if the screen is too small to support both pages of notebook at once
      function handleResize() {
         const width = window.innerWidth;
         const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
         const threshold = 78 * rootFontSize; // 78rem

         if (width < threshold) { setNarrowScreen(true); }
         else { setNarrowScreen(false); }
      }

      handleResize();

      window.addEventListener('resize', handleResize);
      return () => { window.removeEventListener('resize', handleResize); }
   }, []);

   const firstPage = pageList[currentIndex * 2];
   const secondPage = pageList[(currentIndex * 2) + 1];

   useEffect(() => {
      // changes page if arrow key or a/d is pressed
      function handleKeyDown(event: KeyboardEvent) {
         if (event.target && (event.target as HTMLElement).tagName == 'INPUT' || (event.target as HTMLElement).tagName == 'TEXTAREA'){ return; }
         if (event.key == 'a' || event.key == 'ArrowLeft') { previousPage(); }
         if (event.key == 'd' || event.key == 'ArrowRight') { nextPage(); }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => { window.removeEventListener('keydown', handleKeyDown) }
   }, [currentIndex, parentPageNumber]);

   function handlePageChange(newPage: number) {
      if (newPage >= parentPageNumber && newPage < ( parentPageNumber + ( pageList.length / 2 ) )) { setCurrentIndex( newPage - parentPageNumber ); }
      else if (requestNewPage) { requestNewPage(newPage); }
   }

   function previousPage() {
      if ( currentIndex > 0 ) { setCurrentIndex( currentIndex - 1 ); }
      else if ( requestNewPage && parentPageNumber > 1 ) { requestNewPage( parentPageNumber - 1 ); }
   }

   function nextPage(){
      if (currentIndex + 1 < (pageList.length / 2) ) { setCurrentIndex(currentIndex + 1); }
      else if (requestNewPage) { requestNewPage( currentIndex + parentPageNumber + 1 ); }
   }

   return(
      <div className="notebookContainer">
         <div className={`notebook ${displayRight ? 'displayRight' : ''}`}>
            <div className={`notebookPage ${(displayRight && narrowScreen) ? 'shielded' : ''}`} onClick={() => setDisplayRight(false)}>
               {firstPage ? (<firstPage.content {...firstPage.props} />) : null}
            </div>
            <img className="notebookSpine" src="/notebookSpine.png" alt="notebookSpine" />
            <div className={`notebookPage ${(!displayRight && narrowScreen) ? 'shielded' : ''}`} onClick={() => setDisplayRight(true)}>
               {secondPage ? (<secondPage.content {...secondPage.props} />) : null}
            </div>
         </div>
         <PaginationBar currentPage={(currentIndex + parentPageNumber)} totalPages={Math.ceil(pageCount / 2)} requestNewPage={handlePageChange} />
      </div>
   )
}
