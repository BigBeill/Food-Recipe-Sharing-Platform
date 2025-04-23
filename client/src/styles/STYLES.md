# Website Style Guide

This document explains how styles are structured, named, and used throughout the project

## Tech Stack
 - Preprocessor: SCSS

## Design Tokens
We use the following tokens for consistency:
```css
--base-color: #065F46;
--background-color: #f5f8fa;
--supporting-color: #065f46;
--text-color-main: grey;
--text-color-dark: black;
```

## Display Data
Prefabricated methods of displaying specific objects can be found inside displayData.scss with the naming convention display{object name}

### .displayList
for displaying an unordered list if <ul> tags cant be used (ex. <Reorder.group> tags being used)

special classNames inside displayList:
   - listItem: replacement tag if <li> cant be used

special classNames inside listItem:
   - options: for displaying any buttons you want the user to have access to. Buttons inside this field should have some impact on the listItem itself (example: delete/edit the item).

example code
```html
<ul className="displayList">
   <li className="listItem">
      <div className="options">
      </div>
   </li> // use as many of these blocks as needed
</ul>
```

### .displayPinCollection
organizes an array of pins into a displayable collection

special classNames inside displayPinCollections:
   - filterPanel: a tall white panel thats designed to display input options for the user. all input options should in some way allow the user to control what pins are being displayed.

```html
<div classname="displayPinCollection">
   <div classname="filterPanel">
   </div>
   <UserPin></UserPin> // or any other types/amounts of pin components
</div>
```