import React from "react";
import { useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/community";
import Navbar from "../../components/Navbar";
import { ArrowUpRight, Box, Clock, Layers, Sparkles } from "lucide-react";
import Button from "../../components/ui/Button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Community Showcase - ArcVis" },
    { name: "description", content: "Explore amazing architectural spaces designed by the ArcVis community." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
    // In Kubernetes, use the service name directly
    // In development, fallback to request origin
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    let apiBaseUrl: string;
    
    if (isDevelopment || typeof window !== 'undefined') {
        // Development: use request origin
        apiBaseUrl = new URL(request.url).origin;
    } else {
        // Kubernetes: use service name (resolvable within cluster)
        apiBaseUrl = 'http://server-service:5000';
    }
    
    const apiUrl = `${apiBaseUrl}/api/projects?action=list&userId=`;

    console.log(`[Community Loader] Mode: ${isDevelopment ? 'development' : 'kubernetes'}`);
    console.log(`[Community Loader] API Base URL: ${apiBaseUrl}`);
    console.log(`[Community Loader] Fetching from: ${apiUrl}`);

    try {
        const res = await fetch(apiUrl, { 
            headers: { 'Accept': 'application/json' },
            redirect: 'follow'
        });
        console.log(`[Community Loader] Response status: ${res.status}`);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[Community Loader] API error: ${res.status}, ${errorText}`);
            return Response.json({ communityProjects: [] });
        }
        
        const data = await res.json();
        console.log(`[Community Loader] API response:`, data);
        console.log(`[Community Loader] Community projects count:`, data.communityProjects?.length || 0);
        
        // Return only community projects (all public ones)
        return Response.json({ communityProjects: data.communityProjects || [] });
    } catch (error) {
        console.error(`[Community Loader] Fetch error:`, error);
        return Response.json({ communityProjects: [] });
    }
}

export default function Community() {
    const loaderData = useLoaderData() as { communityProjects: DesignItem[] };
    const communityProjects: DesignItem[] = loaderData?.communityProjects || [];
    const navigate = useNavigate();

    console.log(`[Community Component] Loader data:`, loaderData);
    console.log(`[Community Component] Community projects:`, communityProjects);
    console.log(`[Community Component] Projects count:`, communityProjects.length);

    return (
        <div className="community-page min-h-screen bg-background relative overflow-x-hidden text-foreground">
            <Navbar />

            {/* Impressive Hero Section */}
            <main className="hero-showcase pt-32 pb-16 px-6 max-w-[1400px] mx-auto text-center flex flex-col items-center">
                <div className="announce mb-6 inline-flex items-center px-4 py-1.5 rounded-full bg-white/60 border border-zinc-200/60 shadow-sm backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-primary mr-2" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-700">Community Gallery</p>
                </div>
                
                <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-serif leading-[0.9] text-black mb-6 max-w-4xl mx-auto tracking-tight">
                    Explore Spaces <br/> <span className="text-primary italic">Reimagined</span>
                </h1>
                
                <p className="max-w-2xl mx-auto text-sm md:text-base font-sans text-zinc-500 mb-12 leading-relaxed">
                    A curated collection of architectural designs and floor plans instantly rendered into photorealistic 3D environments by the ArcVis community. Dive in and get inspired for your next project.
                </p>
                
                <Button size="lg" className="w-auto shadow-xl rounded-full px-8 py-4 hero-cta" onClick={() => navigate("/")}>
                    Create Your Own Design
                </Button>
            </main>

            {/* Engaging Gallery Grid Section */}
            <section className="gallery-section px-4 md:px-8 pb-32 max-w-[1600px] mx-auto">
                {communityProjects.length === 0 ? (
                    <div className="empty-state w-full rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-20 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-secondary rounded-full flex items-center justify-center mb-6">
                            <Layers className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-serif text-black mb-2">The Gallery is Empty</h3>
                        <p className="text-zinc-500 max-w-md">Be the first to share your creative visualizations with the community!</p>
                        <Button className="mt-8" onClick={() => navigate("/")}>Start Designing</Button>
                    </div>
                ) : (
                    <div className="community-grid">
                        {communityProjects.map((project: any, index: number) => {
                            // Alternate sizes for visual interest using span classes
                            const isLarge = index % 5 === 0;
                            const isTall = index % 3 === 0 && !isLarge;
                            
                            return (
                                <div 
                                    key={project.id} 
                                    className={`gallery-card group ${isLarge ? 'col-span-1 md:col-span-2 row-span-2' : isTall ? 'col-span-1 row-span-2' : 'col-span-1 row-span-1'}`}
                                    onClick={() => navigate(`/visualizer/${project.id}`)}
                                >
                                    {/* Full bleed image */}
                                    <div className="image-wrapper">
                                        <img 
                                            src={project.renderedImage || project.sourceImage} 
                                            alt={project.name || "Community Design"}
                                            className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    </div>

                                    {/* Gradient overlay for text legibility */}
                                    <div className="overlay-gradient"></div>
                                    
                                    {/* Hover Information */}
                                    <div className="card-content flex flex-col justify-end p-6 md:p-8 h-full w-full absolute inset-0 z-20">
                                        
                                        <div className="meta-top flex justify-between w-full opacity-0 translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                                            <div className="badge inline-flex bg-white/90 backdrop-blur border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 flex items-center">
                                                    <Box className="w-3 h-3 mr-1.5"/> Community
                                                </span>
                                            </div>
                                            <div className="arrow-btn w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg pointer-events-none">
                                                <ArrowUpRight className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="meta-bottom mt-auto opacity-0 translate-y-[20px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out delay-75">
                                            <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-tight drop-shadow-md">
                                                {project.name || "Untitled Residence"}
                                            </h3>
                                            <div className="flex items-center space-x-3 text-white/80 font-mono text-xs uppercase tracking-wider font-bold">
                                                <span className="flex items-center drop-shadow-sm">
                                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                                    {new Date(project.sharedAt || project.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
