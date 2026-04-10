import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import {ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react";
import Button from "../../components/ui/Button";
import Upload from "../../components/Upload";
import { useLoaderData, useNavigate, useOutletContext } from "react-router";
import { useEffect, useRef, useState } from "react";
import { createProject } from "../../lib/puter.action";

export async function loader({ request }: Route.LoaderArgs) {
    // Database queries now handled by Express backend API
    // Frontend will fetch community projects on client side
    return { 
        communityProjects: []
    };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
    const { communityProjects: initialCommunityProjects } = useLoaderData<typeof loader>();
    const { userId } = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [userProjects, setUserProjects] = useState<DesignItem[]>([]);
    const [communityProjects, setCommunityProjects] = useState<DesignItem[]>(initialCommunityProjects);
    const isCreatingProjectRef = useRef(false);

    const handleUploadComplete = async (base64Image: string) => {
        try {

            if(isCreatingProjectRef.current) return false;
            isCreatingProjectRef.current = true;
            const newId = Date.now().toString();
            const name = `Residence ${newId}`;

            const newItem = {
                id: newId, name, sourceImage: base64Image,
                renderedImage: undefined,
                timestamp: Date.now()
            }

            const saved = await createProject({ item: newItem, visibility: 'private' });

            if(!saved) {
                console.error("Failed to create project");
                return false;
            }

            setUserProjects((prev) => [saved, ...prev]);

            navigate(`/visualizer/${newId}`, {
                state: {
                    initialImage: saved.sourceImage,
                    initialRendered: saved.renderedImage || null,
                    name
                }
            });

            return true;
        } finally {
            isCreatingProjectRef.current = false;
        }
    }

    useEffect(() => {
        const fetchUserProjects = async () => {
            if (!userId) return;
            try {
                const response = await fetch(`/api/projects?action=list&userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserProjects(data.userProjects || []);
                }
            } catch (e) {
                console.error("Failed to fetch user projects", e);
            }
        }

        fetchUserProjects();
    }, [userId]);

    useEffect(() => {
        const fetchCommunityProjects = async () => {
            try {
                const response = await fetch('/api/projects?action=list');
                if (response.ok) {
                    const data = await response.json();
                    setCommunityProjects(data.communityProjects || []);
                }
            } catch (e) {
                console.error("Failed to fetch community projects", e);
            }
        }

        fetchCommunityProjects();
    }, []);

  return (
      <div className="home">
          <Navbar />

          <section className="hero">
              <div className="announce">
                  <div className="dot">
                      <div className="pulse"></div>
                  </div>

                  <p>Introducing ArcVis 1.0</p>
              </div>

              <h1>Build beautiful spaces at the speed of thought with ArcVis</h1>

              <p className="subtitle">
                  ArcVis is an AI-first design environment that helps you visualize, render, and ship architectural projects faster  than ever.
              </p>

              <div className="actions">
                  <a href="#upload" className="cta">
                      Start Building <ArrowRight className="icon" />
                  </a>

                  <Button variant="outline" size="lg" className="demo">
                      Watch Demo
                  </Button>
              </div>

              <div id="upload" className="upload-shell">
                <div className="grid-overlay" />

                  <div className="upload-card">
                      <div className="upload-head">
                          <div className="upload-icon">
                              <Layers className="icon" />
                          </div>

                          <h3>Upload your floor plan</h3>
                          <p>Supports JPG, PNG, formats up to 10MB</p>
                      </div>

                      <Upload onComplete={handleUploadComplete} />
                  </div>
              </div>
          </section>

          <section className="projects">
              <div className="section-inner">
                  <div className="section-head">
                      <div className="copy">
                          <h2>My Projects</h2>
                          <p>Your latest work and designs.</p>
                      </div>
                  </div>

                  <div className="projects-grid">
                      {userProjects.map(({id, name, renderedImage, sourceImage, timestamp, isPublic}) => (
                          <div key={id} className="project-card group" onClick={() => navigate(`/visualizer/${id}`)}>
                              <div className="preview">
                                  <img  src={renderedImage || sourceImage} alt="Project"
                                  />

                                  {isPublic && (
                                      <div className="badge">
                                          <span>Community</span>
                                      </div>
                                  )}
                              </div>

                              <div className="card-body">
                                  <div>
                                      <h3>{name}</h3>

                                      <div className="meta">
                                          <Clock size={12} />
                                          <span>{new Date(timestamp).toLocaleDateString()}</span>
                                          <span>By You</span>
                                      </div>
                                  </div>
                                  <div className="arrow">
                                      <ArrowUpRight size={18} />
                                  </div>
                              </div>
                          </div>
                      ))}
                      {userProjects.length === 0 && (
                          <p className="text-zinc-500">You haven't created any projects yet.</p>
                      )}
                  </div>
                  
                  <div className="section-head" style={{ marginTop: '4rem' }}>
                      <div className="copy">
                          <h2>Community Projects</h2>
                          <p>Explore designs shared by the community.</p>
                      </div>
                  </div>

                  <div className="projects-grid">
                      {communityProjects.map(({id, name, renderedImage, sourceImage, timestamp}) => (
                          <div key={id} className="project-card group" onClick={() => navigate(`/visualizer/${id}`)}>
                              <div className="preview">
                                  <img  src={renderedImage || sourceImage} alt="Project"
                                  />

                                  <div className="badge">
                                      <span>Community</span>
                                  </div>
                              </div>

                              <div className="card-body">
                                  <div>
                                      <h3>{name}</h3>

                                      <div className="meta">
                                          <Clock size={12} />
                                          <span>{new Date(timestamp).toLocaleDateString()}</span>
                                          <span>By Community</span>
                                      </div>
                                  </div>
                                  <div className="arrow">
                                      <ArrowUpRight size={18} />
                                  </div>
                              </div>
                          </div>
                      ))}
                      {communityProjects.length === 0 && (
                          <p className="text-zinc-500">No community projects available yet.</p>
                      )}
                  </div>
              </div>
          </section>
      </div>
  )
}
