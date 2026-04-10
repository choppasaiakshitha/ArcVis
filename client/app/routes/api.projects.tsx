// NOTE: All API endpoints have been moved to the Express backend server.
// This file is kept for routing purposes only. 
// See server/routes/projects.ts for the actual implementation.
// The frontend will make requests to the separate Express API server.

import type { Route } from "./+types/api.projects";

export async function loader({ request }: Route.LoaderArgs) {
    // All requests are now handled by the Express backend API
    // This React Router handler is deprecated
    return Response.json({ error: "API moved to Express backend" }, { status: 410 });
}

export async function action({ request }: Route.ActionArgs) {
    // All requests are now handled by the Express backend API
    // This React Router handler is deprecated
    return Response.json({ error: "API moved to Express backend" }, { status: 410 });
}
