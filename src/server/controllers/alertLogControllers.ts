import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.ts';

export const getAlertLog = async (req: Request, res: Response, next: NextFunction) => {
    try {

        // Pagination settings:
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // All active alertLogs inside db.
        const alertLogs = await prisma.alertLog.findMany({
            take: limit,
            skip: skip,
            orderBy: { triggeredAt: 'desc'},
            include: { neighborhood: true }
        });

        // Pagination infos:
        const totalAlertLogs = await prisma.alertLog.count();
        const totalPages = Math.ceil(totalAlertLogs / limit);

        res.status(200).json({
            data: alertLogs,
            meta: {
                totalRecords: totalAlertLogs,
                currentPage: page,
                totalPages: totalPages,
                limit: limit
            },
        });

    } catch (err) {
        next(err);
    };
};

export const createAlertLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { neighborhoodId, rainLevel, tideLevel } = req.body;

        // Creating a new alertLog with all infos("req.body").
        const newAlertLogs = await prisma.alertLog.create({
            data: {
                neighborhoodId,
                rainLevel,
                tideLevel
            },
        });
        
        res.status(201).json(newAlertLogs);
        
    } catch (err) {
        next(err);
    };
};

export const updateAlertLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { neighborhoodId, rainLevel, tideLevel } = req.body;

        const id = Number(req.params.id);
        // Updating a alertLog by id, replacing everything with all infos("req.body").
        const alertLog = await prisma.alertLog.update({
            where: {id: id},
            data: {
                neighborhoodId,
                rainLevel,
                tideLevel
            },
        });
        
        res.status(200).json(alertLog);
        
    } catch (err) {
        next(err);
    };
};

export const deleteAlertLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        // Deleting a alertLog by id.
        const deletedAlertLog = await prisma.alertLog.delete({
            where: {id: id},
        });
        
        res.status(200).json({ message: "AlertLog deleted", deletedAlertLog });
        
    } catch (err) {
        next(err);
    };
};