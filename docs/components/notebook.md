# Component Documentation
On the client side, some components in this project can be a bit tricky to use at first. This section explains how to use them properly.

## Notebook.tsx Documentation
location: client/src/components/Notebook.jsx

The Notebook component simulates a flip-book style UI for content you wish to display to the user.
It will display two react components at a time, inside the notebook pages (each page sharing the screen space width wise).
Any additional react components will be accessible through a pagination bar under the notebook.

### Using Notebook.tsx

Notebook accepts the following 4 props:
- componentList
   - Required prop.
   - JSON object array (continue reading for structure)
   - Array of page objects to display in the notebook.
- parentPageNumber
   - Optional prop.
   - Number
   - Tells notebook the exact page number that the first component in componentList belongs to. 
   - Defaults to 1.
- requestNewPage
   - Optional prop.
   - Function (continue reading for structure)
   - A function that fires when a user tries to navigate to a page that doesn’t exist yet. 
- componentCount
   - Optional prop.
   - Number
   - Tells the notebook how many components exist, even if not all of them appear inside componentList.
   - Defaults to size of componentList

Note: looking at the naming conventions, you may notice that some props reference pages and others reference components, a page is just a set of 2 components. So the 5th and 6th components should be displayed on page 3.

### componentList Structure
ComponentList is an array of JSON objects. Two of these objects make up a single page. Each object consists of two fields:
 - content: the react component that will be displayed on the notebook page
 - props: an object containing the props being passed to the content component (field name is what the content component reads the prop as)

### requestNewPage structure
This is a function that accepts one numerical prop. When the Notebook tries to display a page that it doesn't currently have access to the components for (like trying to display components 5 and 6 when only having access to 4 components) this function will be called, passing the page trying to be accessed as a numerical value prop. Its then this functions job to figure out how to handle accessing the page that's not currently accessible.

### Example Code
Some sample code for creating a paginated list while utilizing Notebook.jsx:

Note: in this example RecipePreview.jsx is a regular react component that takes a recipe as a prop
```js
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Notebook from '../components/Notebook';
import PageComponentObject from '../interfaces/PageComponentObject';
import RecipePreview from '../components/notebookPages/RecipePreview';

export default function Home() {
   const [searchParams, setSearchParams] = useSearchParams();
   const pageNumber: number = Number(searchParams.get('pageNumber')) || 1;

   const [componentList, setComponentList] = useState<PageComponentObject[]>([]);
   const [componentCount, setComponentCount] = useState<number>(0);

   // handle fetching page contents
   function handlePageChange(newPage: number) {

      // update the url to have the new page number
      const newParam = new URLSearchParams(searchParams.toString());
      newParam.set('pageNumber', newPage.toString());
      setSearchParams(newParam);

      // empty the componentList so the page does not look frozen to user
      setComponentList([]);

      //send a request to the server for 2 new items, based on newPage value
      axios({method: 'get', url: `recipe/find?limit=2&skip=${((newPage - 1) * 2)}&count=true`})
      .then((response) => {
         // make sure enough entries exist in the database to display requested page
         const maxPages = Math.round(((response.count + 1) / 2) + 1);
         if (maxPages >= newPage) {
            // add each recipe to a component list
            let newComponentList: PageComponentObject[] = [];
            response.recipeObjectArray.forEach((recipe) => {
               newComponentList.push({
                  content: RecipePreview,
                  props: {
                     recipe
                  }
               })
            });
            setComponentList(newComponentList);
            setComponentCount(response.count);
         }
         // if page being requested is too large to be accessible, return a page that isn't
         else { handlePageChange(maxPages) }
      });
   }

   return <Notebook componentList={componentList} parentPageNumber={pageNumber} requestNewPage={handlePageChange} componentCount={componentCount}/>
}
```