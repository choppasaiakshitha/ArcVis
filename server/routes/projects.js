import express from 'express';
import { Project } from '../models/Project.js';

const router = express.Router();

// GET /api/projects - List projects
router.get('/', async (req, res) => {
    try {
        const { action, userId } = req.query;

        if (action === 'list') {
            let userProjects = [];
            if (userId) {
                userProjects = await Project.find({ ownerId: userId })
                    .sort({ timestamp: -1 })
                    .lean();
            }

            // Community projects are all public projects
            const communityProjects = await Project.find({ isPublic: true })
                .sort({ sharedAt: -1 })
                .lean();

            return res.json({ userProjects, communityProjects });
        }

        if (action === 'get') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'Project ID is required' });
            }

            const project = await Project.findOne({ id }).lean();
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            return res.json({ project });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error('GET /api/projects error:', error);
        return res.status(500).json({ error: error.message || 'Unknown Error' });
    }
});

// POST /api/projects - Create/Update or Share project
router.post('/', async (req, res) => {
    try {
        const { action } = req.query;
        const body = req.body;

        if (action === 'save') {
            const { project: payload } = body;

            if (!payload || !payload.id || !payload.sourceImage) {
                return res
                    .status(400)
                    .json({ error: 'Project ID and sourceImage are required' });
            }

            // Using upsert (update or insert)
            const updatedProject = await Project.findOneAndUpdate(
                { id: payload.id },
                { $set: payload },
                { new: true, upsert: true, returnDocument: 'after' }
            ).lean();

            return res.json({ saved: true, project: updatedProject });
        }

        if (action === 'share') {
            const { id, action: shareAction, userId } = body;

            if (!id || !shareAction) {
                return res
                    .status(400)
                    .json({ error: 'Project ID and action are required' });
            }

            const updatedProject = await Project.findOneAndUpdate(
                { id },
                {
                    $set: {
                        isPublic: shareAction === 'share',
                        sharedAt: shareAction === 'share' ? new Date().toISOString() : null,
                        sharedBy: shareAction === 'share' ? userId : null,
                    },
                },
                { new: true, returnDocument: 'after' }
            ).lean();

            return res.json({ project: updatedProject });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error('POST /api/projects error:', error);
        return res.status(500).json({ error: error.message || 'Unknown Error' });
    }
});

export default router;
