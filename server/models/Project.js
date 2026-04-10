import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: String,
        sourceImage: {
            type: String,
            required: true,
        },
        sourcePath: String,
        renderedImage: String,
        renderedPath: String,
        publicPath: String,
        timestamp: {
            type: Number,
            required: true,
        },
        ownerId: String,
        sharedBy: String,
        sharedAt: String,
        isPublic: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
projectSchema.index({ ownerId: 1, timestamp: -1 });
projectSchema.index({ isPublic: 1, sharedAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
