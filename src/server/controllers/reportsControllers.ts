import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.ts';

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // All active reports inside db.
        const reports = await prisma.userReport.findMany({
            orderBy: { createdAt: 'desc'}
        });

        res.status(200).json(reports);

    } catch (err) {
        next(err);
    };
};

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { title, description, contactNumber, neighborhood } = req.body;

        // Creating a new report with all infos("req.body").
        const newReports = await prisma.userReport.create({
            data: {
                title,
                description,
                contactNumber,
                neighborhood
            }
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
            }
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