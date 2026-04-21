import { Request, Response, NextFunction } from 'express';
import { z, AnyZodObject } from 'zod';

export const validateData = (schema: AnyZodObject) => {
    return (async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validating data.
            schema.parse(req.body);
            
            // Data is good to pass.
            next();
            
        } catch(err) {
            if ( err instanceof z.ZodError ) {
                console.error(err);
                // 400 (bad request)
                res.status(400).json({errors: err.errors});
    
            } else {
                console.error(err);
                res.status(500).json({error: 'Erro no sistema, tente novamente mais tarde.'});
            };
        };
    });
};