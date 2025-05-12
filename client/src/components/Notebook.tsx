import { useState, useEffect } from 'react';

import '../styles/componentSpecific/notebook.scss';
import PageObject from '../interfaces/PageObject';
import PaginationBar from './PaginationBar';

/*
using notebook component:

a page that is calling notebook should be setup the following way...

2 main component types:
   parentComponent (the component that will be exported)
   childComponents (contains the content that will be displayed on each page)

parentComponent should be setup as follows:

export default function ParentComponent() {

   //all global javascript needs to be put here
   const [exampleVariable, setExampleVariable] = useState()
   function exampleFunction() {}

   //continue reading documentation for pageList explanation
   const pageList = [{}]

   //no html should appear in the parent
   return <Notebook pageList={pageList} />
}

childComponents are setup as normal components:

function ChildComponent({text, setText, eventHandler}) {
   //treat this as a normal component
}
    


their are 4 props that can be given to Notebook.jsx by the parent component:
   pageList: an array of json files (required)
   parentPageNumber: a number that will be added to the page number
   requestNewPage: a function that will be called when the last page is reached
   pageCount: the total number of possible pages given to the notebook

the pageList is an array of json objects
each json file contains a childComponent and its props and should be setup as follows:
{
   content: ChildComponent,
   props: {
      search: exampleVariable,
      setSearch: setExampleVariable, 
      searchFunction: exampleFunction
   }
}
*/

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
   
   const [firstPage, setFirstPage] = useState<PageObject>(pageList[0]);
   const [secondPage, setSecondPage] = useState<PageObject>(pageList[1]);

   useEffect(() => {
      console.log('notebook mounted:', pageList);
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

   useEffect(() => {
      setFirstPage(pageList[currentIndex * 2]);
      setSecondPage(pageList[(currentIndex * 2) + 1]);
   }, [currentIndex]);

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
      if (newPage >= parentPageNumber && newPage <= ( parentPageNumber + ( pageList.length / 2 ) )) { setCurrentIndex( newPage - parentPageNumber ); }
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
         <PaginationBar currentPage={(currentIndex + parentPageNumber)} totalPages={(pageCount / 2)} requestNewPage={handlePageChange} />
      </div>
   )
}
