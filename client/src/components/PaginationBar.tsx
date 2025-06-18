import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import "../styles/componentSpecific/paginationBar.scss";

interface PaginationBarProps {
   currentPage: number;
   totalPages: number;
   requestNewPage: (page: number) => void;
}

export default function PaginationBar({ currentPage, totalPages, requestNewPage }: PaginationBarProps) {

   function handlePageChange(newPage: number) {
      console.log(`Current Page: ${currentPage}, Total Pages: ${totalPages}`);
      if (newPage < 1 || newPage > totalPages) { return; }
      requestNewPage(newPage);
   }

   return (
      <div className="paginationBar">
         <button onClick={() => handlePageChange(currentPage - 1)} > <FontAwesomeIcon icon={faArrowLeft} /> </button>
         { currentPage == 4 ? (
            <>
               <button onClick={() => handlePageChange(1)}> 1 </button>
            </>
         ): currentPage > 4 ? (
            <>
               <button onClick={() => handlePageChange(1)}> 1 </button>
               <button onClick={() => handlePageChange(2)}> 2 </button>
            </>
         ) : null }
         { currentPage > 5 ? (<p>...</p>) : null}
         { currentPage > 2 ? (<button onClick={() => handlePageChange(currentPage - 2)}> {currentPage - 2} </button>) : null }
         { currentPage > 1 ? (<button onClick={() => handlePageChange(currentPage - 1)}> {currentPage - 1} </button>) : null }
         <p className="primaryBlock">{currentPage}</p>
         { currentPage < totalPages ?  (<button onClick={() => handlePageChange(currentPage + 1)}> {currentPage + 1} </button>) : null}
         { currentPage < totalPages - 1 ? (<button onClick={() => handlePageChange(currentPage + 2)}> {currentPage + 2} </button>) : null }
         { currentPage < totalPages - 4 ? (<p>...</p>) : null}
         { currentPage == (totalPages - 3)? (
            <>
               <button onClick={() => handlePageChange(totalPages)}> {totalPages} </button>
            </>
         ) : currentPage < (totalPages - 3)? (
            <>
              <button  onClick={() => handlePageChange(totalPages - 1)}> {totalPages - 1} </button>
              <button onClick={() => handlePageChange(totalPages)}> {totalPages} </button> 
            </>
         ) : null}
         <button onClick={() => handlePageChange(currentPage + 1)} > <FontAwesomeIcon icon={faArrowRight} /> </button>
      </div>
   )
}