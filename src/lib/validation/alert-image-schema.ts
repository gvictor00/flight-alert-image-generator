import { z } from 'zod';

const listItemSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1, 'O item nao pode ficar vazio.')
});

const journeyBlockSchema = z.object({
  route: z.string().min(1, 'A rota e obrigatoria.'),
  costs: z.array(listItemSchema).min(1, 'Informe ao menos um custo.'),
  dates: z.array(listItemSchema).min(1, 'Informe ao menos um bloco de datas.')
});

export const alertImageSchema = z
  .object({
    template: z.enum(['one-way', 'round-trip']),
    title: z.string().min(1, 'O titulo e obrigatorio.'),
    themeKey: z.string().min(1),
    destinationImage: z.string().min(1, 'A imagem do destino e obrigatoria.'),
    destinationImageSettings: z.object({
      fit: z.enum(['cover', 'contain']),
      scale: z.number().min(0.2).max(4),
      offsetX: z.number().min(-1000).max(1000),
      offsetY: z.number().min(-1000).max(1000)
    }),
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
