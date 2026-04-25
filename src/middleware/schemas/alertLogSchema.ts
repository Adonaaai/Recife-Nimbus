import { z } from 'zod';

export const alertLogSchema = z.object({
    neighborhoodId: z.number({
        required_error: 'O ID do bairro é obrigatório.',
        invalid_type_error: 'O ID do bairro deve ser um número.'
    }).int().positive('O ID deve ser um número positivo.'),

    rainLevel: z.coerce.number()({
        invalid_type_error: 'O nível de chuva deve ser um número.'
    }).nonnegative('O nível de chuva não pode ser negativo.')
      .optional(),

    tideLevel: z.coerce.number()({
        invalid_type_error: 'O nível da maré deve ser um número.'
    }).optional()

}).refine((data) => data.rainLevel !== undefined || data.tideLevel !== undefined, {
    message: 'Um alerta deve conter pelo menos o nível de chuva ou o nível da maré.',
    path: ['rainLevel'] // This points the error to the rainLevel field if both are missing
});