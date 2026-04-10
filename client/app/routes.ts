import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('visualizer/:id', './routes/visualizer.$id.tsx'),
    route('api/projects', './routes/api.projects.tsx'),
    route('community', './routes/community.tsx'),
    route('blueprint/new', './routes/blueprint.new.tsx'),
    route('features', './routes/features.tsx')
] satisfies RouteConfig;
