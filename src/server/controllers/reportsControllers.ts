import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.ts';

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {

        // Pagination settings:
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // All active reports inside db.
        const reports = await prisma.userReport.findMany({
            take: limit,
            skip: skip,
            orderBy: { createdAt: 'desc'}
        });

        // Pagination infos:
        const totalReports = await prisma.userReport.count();
        const totalPages = Math.ceil(totalReports / limit);

        res.status(200).json({
            data: reports,
            meta: {
                totalRecords: totalReports,
                currentPage: page,
                totalPages: totalPages,
                limit: limit
            },
        });

    } catch (err) {
        next(err);
    };
};

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get the files from the request (Multer puts them here)
        const files = req.files as Express.Multer.File[];

        const { title, description, contactNumber, neighborhood } = req.body;

        const mediaData = files ? files.map( file => ({
            url: `/uploads/${file.filename}`,
            fileType: file.mimetype
        })) : [];

        // Creating a new report with all infos("req.body").
        const newReports = await prisma.userReport.create({
            data: {
                title,
                description,
                contactNumber,
                neighborhood,
                media: {
                    create: mediaData
                },
            },

            include: {
                media: true
            },
        });
        
        res.status(201).json(newReports);
        
    } catch (err) {
        next(err);
    };
};

export const updateReport = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { title, description, contactNumber, neighborhood } = req.body;

        const id = Number(req.params.id);
        // Updating a report by id, replacing everything with all infos("req.body").
        const report = await prisma.userReport.update({
            where: {id: id},
            data: {
                title,
                description,
                contactNumber,
                neighborhood
            },
        });
        
        res.status(200).json(report);
        
    } catch (err) {
        next(err);
    };
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        // Deleting a report by id.
        const deletedReport = await prisma.userReport.delete({
            where: {id: id},
        });
        
        res.status(200).json({ message: "Report deleted", deletedReport });
        
    } catch (err) {
        next(err);
    };
};