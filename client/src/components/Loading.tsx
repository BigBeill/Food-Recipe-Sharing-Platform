import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

export default function Loading() {
    return(
        <div className="loadingContainer">
            <p> <FontAwesomeIcon className="loadingIcon" icon={faCircleNotch} /> Loading...</p>
            <p>
                If its been over 15 minutes since you last accessed this site the <br />
                server may have gone into sleep mode. Give it a moment to wake up.
            </p>
        </div>
    )
}