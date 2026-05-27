export const CATEGORIES: Record<string, string> = {
  scrub:                "Scrub Microfibra",
  scrub_tech:           "Scrub Tecnológico",
  macacao:              "Macacão",
  jaleco_fem:           "Jaleco Feminino",
  jaleco_masc:          "Jaleco Masculino",
  jaleco_dentista_fem:  "Jaleco Dentista Fem.",
  jaleco_dentista_masc: "Jaleco Dentista Masc.",
  blusa:                "Blusa Estampada",
};

export const PAYMENT_LABELS: Record<string, string> = {
  pix:               "PIX",
  dinheiro:          "Dinheiro",
  cartao_credito:    "Cartão Crédito",
  cartao_debito:     "Cartão Débito",
  link_de_pagamento: "Link de Pagamento",
};

export const SHIPPING_LABELS: Record<string, string> = {
  none:     "Sem frete",
  excursao: "Excursão (+R$ 10)",
  motoboy:  "Motoboy (+R$ 15)",
  correios: "Correios (informar valor)",
};

export const SHIPPING_FIXED: Record<string, number> = {
  none: 0, excursao: 10, motoboy: 15, correios: 0,
};

export const EXPENSE_CATEGORIES = [
  "Geral", "Estoque", "Marketing", "Logística",
  "Aluguel", "Salários", "Impostos", "Utilities", "Outros",
];

export const SIZES = ["PP", "P", "M", "G", "GG", "XGG", "Único"];
