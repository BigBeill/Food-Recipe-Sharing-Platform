import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PopupProps {
   Child: React.ComponentType<any>;
   childProps?: { [key: string]: any; }
   closePopup: (show: boolean) => void;
}

export default function Popup({Child, childProps, closePopup}: PopupProps) {
   const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

   useEffect(() => {
      setPortalRoot(document.getElementById("portal-root"));
   }, []);

   if (!portalRoot) { return null;}

   return createPortal(
      <div className="displayPopup fadeIn">
         <div className="popupContent slideUp">
            <div className="splitSpace">
               <button className="closePopup" onClick={() => {closePopup(false)}}>&larr; Return</button>
               <div></div>
            </div>
            <Child {...childProps} />
         </div>
      </div>,
      portalRoot
   );
}