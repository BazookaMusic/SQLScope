import { GiWoodenDoor } from "react-icons/gi";

const  NotFoundLabel = (
    <div className="flex items-center w-full flex-col">
        <GiWoodenDoor  size={300} color="#ff79c6" ></GiWoodenDoor >
        <label className="text-dracula-pink text-l w-full text-center inline-block">There's nothing here! Try a different path!</label>
    </div>
)

export {NotFoundLabel}