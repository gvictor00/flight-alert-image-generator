import { z } from 'zod';

const listItemSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1, 'O item não pode ficar vazio.')
});

const journeyBlockSchema = z.object({
  route: z.string().min(1, 'A rota é obrigatória.'),
  costs: z.array(listItemSchema).min(1, 'Informe ao menos um custo.'),
  dates: z.array(listItemSchema).min(1, 'Informe ao menos um bloco de datas.')
});

export const alertImageSchema = z
  .object({
    template: z.enum(['one-way', 'round-trip']),
    title: z.string().min(1, 'O título é obrigatório.'),
    themeKey: z.string().min(1),
    destinationImage: z.string().min(1, 'A imagem do destino é obrigatória.'),
    outbound: journeyBlockSchema,
    inbound: journeyBlockSchema.optional(),
    footer: z.object({
      primaryLine: z.string().min(1),
      secondaryLine: z.string().min(1),
      generatedAtLine: z.string().min(1)
    })
  })
  .superRefine((value, ctx) => {
    if (value.template === 'round-trip' && !value.inbound) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inbound'],
        message: 'O template ida e volta exige os dados da volta.'
      });
    }
  });

export type AlertImageFormInput = z.infer<typeof alertImageSchema>;
