import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.ts';

export const getNeighborhoods = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Pagination settings:
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { isActive: true };

        // All active neighborhoods inside db.
        const neighborhoods = await prisma.neighborhood.findMany({
            where: filter,
            take: limit,
            skip: skip,
            orderBy: { name: 'asc' },
            include: { city: true }
        });

        // Pagination infos:
        const totalNeighborhoods = await prisma.neighborhood.count();
        const totalPages = Math.ceil(totalNeighborhoods / limit);

        res.status(200).json({
            data: neighborhoods,
            meta: {
                totalRecords: totalNeighborhoods,
                currentPage: page,
                totalPages: totalPages, 
                limit: limit
            } 
        });

    } catch (err) {
        next(err);
    };
};