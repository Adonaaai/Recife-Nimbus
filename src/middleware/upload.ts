import multer from 'multer';
import path from 'path';

// 1. Where to store the files and what to name them.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// 2. Filter out bad files (Only allow images and videos).
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {

    const isAccepted = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

    if (!isAccepted) {
        cb(new Error('Apenas imagens e vídeos são permitidos!'));
        
    } else {
        cb(null, true);
    };
};
// main middleware
export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // Limit to 50MB per file
    },
});