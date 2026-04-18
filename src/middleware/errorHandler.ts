import { Request, Response, NextFunction} from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('---GLOBAL-ERROR-CAUGHT---');
    console.error(err.stack);

    res.status(500).json({
        message: err.message || 'Erro interno no servidor. Tente novamente mais tarde'
    });
};
