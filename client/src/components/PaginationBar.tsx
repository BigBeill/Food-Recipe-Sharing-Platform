import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import "../styles/componentSpecific/paginationBar.scss";

interface PaginationBarProps {
   currentPage: number;
   totalPages: number;
   requestNewPage: (page: number) => void;
}

export default function PaginationBar({ currentPage, totalPages, requestNewPage }: PaginationBarProps) {

   return (
      <div className="paginationBar">
         <button onClick={() => requestNewPage(currentPage - 1)} > <FontAwesomeIcon icon={faArrowLeft} /> </button>
         { currentPage == 4 ? (
            <>
               <button onClick={() => requestNewPage(0)}> 1 </button>
            </>
         ): currentPage > 4 ? (
            <>
               <button onClick={() => requestNewPage(0)}> 1 </button>
               <button onClick={() => requestNewPage(1)}> 2 </button>
            </>
         ) : null }
         { currentPage > 5 ? (<p>...</p>) : null}
         { currentPage > 2 ? (<button onClick={() => requestNewPage(currentPage - 2)}> {currentPage - 2} </button>) : null }
         { currentPage > 1 ? (<button onClick={() => requestNewPage(currentPage - 1)}> {currentPage - 1} </button>) : null }
         <p className="primaryBlock">{currentPage}</p>
         { currentPage < totalPages ?  (<button onClick={() => requestNewPage(currentPage + 1)}> {currentPage + 1} </button>) : null}
         { currentPage < totalPages - 1 ? (<button onClick={() => requestNewPage(currentPage + 2)}> {currentPage + 2} </button>) : null }
         { currentPage < totalPages - 4 ? (<p>...</p>) : null}
         { currentPage == (totalPages - 3)? (
            <>
               <button onClick={() => requestNewPage(totalPages)}> {totalPages} </button>
            </>
         ) : currentPage < (totalPages - 3)? (
            <>
              <button  onClick={() => requestNewPage(totalPages - 1)}> {totalPages - 1} </button>
              <button onClick={() => requestNewPage(totalPages)}> {totalPages} </button> 
            </>
         ) : null}
         <button onClick={() => requestNewPage(currentPage + 1)} > <FontAwesomeIcon icon={faArrowRight} /> </button>
      </div>
   )
}