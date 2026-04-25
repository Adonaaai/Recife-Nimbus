import { z } from 'zod';

export const userReportSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'Titulo vazio!')
        .max(100, 'O título deve ter no máximo 100 caracteres.'), 
        
    description: z.string()
        .trim()
        .min(1, 'Descrição vazia!')
        .max(1000, 'A descrição é muito longa.'),
        
    contactNumber: z.string()
        .trim()
        .min(8, 'Insira um numero valido!')
        .optional() 
        .or(z.literal('')),
        
    neighborhood: z.string()
        .trim()
        .min(1, 'Campo vazio!')
});