import { ReactNode } from "react";

function GetComponentFromRoutes(
    location: string,
    routes: { [path: string]: () => ReactNode }
  ): ReactNode | null 
  {
    return routes[location]() || null; // Return the component if found, otherwise null
  }

  export {GetComponentFromRoutes}