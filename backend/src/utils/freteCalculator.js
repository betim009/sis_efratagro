/**
 * Motor de cálculo de frete isolado e reutilizável.
 *
 * Estratégia de cálculo:
 *   POR_REGIAO   → valor_fixo da tabela (flat rate por região)
 *   POR_PESO     → valor_base + (peso_total_kg × valor_por_kg)
 *   POR_DISTANCIA→ valor_base + (distancia_km × valor_por_km)
 *   HIBRIDO      → valor_base + (peso_total_kg × valor_por_kg) + (distancia_km × valor_por_km) + valor_fixo
 *   MANUAL       → valor informado diretamente (não usa tabela)
 *
 * Decisões de negócio:
 *   - Cálculo POR_REGIAO usa valor_fixo porque cada região já tem um valor tabelado.
 *   - HIBRIDO soma todos os componentes para cobrir situações complexas.
 *   - O resultado é arredondado para 2 casas decimais (centavos).
 *   - Se a tabela não se aplica ao peso/distância informados, retorna AppError.
 */

const AppError = require("./AppError");

const calcularPorRegiao = (tabela) => {
  return tabela.valor_fixo > 0 ? Number(tabela.valor_fixo) : Number(tabela.valor_base);
};

const calcularPorPeso = (tabela, pesoTotalKg) => {
  if (tabela.peso_maximo > 0 && pesoTotalKg > Number(tabela.peso_maximo)) {
    throw new AppError(
      `Peso ${pesoTotalKg} kg excede o maximo da tabela (${tabela.peso_maximo} kg)`,
      400
    );
  }

  if (pesoTotalKg < Number(tabela.peso_minimo)) {
    throw new AppError(
      `Peso ${pesoTotalKg} kg abaixo do minimo da tabela (${tabela.peso_minimo} kg)`,
      400
    );
  }

  return Number(tabela.valor_base) + pesoTotalKg * Number(tabela.valor_por_kg);
};

const calcularPorDistancia = (tabela, distanciaKm) => {
  if (tabela.distancia_maxima > 0 && distanciaKm > Number(tabela.distancia_maxima)) {
    throw new AppError(
      `Distancia ${distanciaKm} km excede o maximo da tabela (${tabela.distancia_maxima} km)`,
      400
    );
  }

  if (distanciaKm < Number(tabela.distancia_minima)) {
    throw new AppError(
      `Distancia ${distanciaKm} km abaixo do minimo da tabela (${tabela.distancia_minima} km)`,
      400
    );
  }

  return Number(tabela.valor_base) + distanciaKm * Number(tabela.valor_por_km);
};

const calcularHibrido = (tabela, pesoTotalKg, distanciaKm) => {
  return (
    Number(tabela.valor_base) +
    pesoTotalKg * Number(tabela.valor_por_kg) +
    distanciaKm * Number(tabela.valor_por_km) +
    Number(tabela.valor_fixo)
  );
};

/**
 * Calcula o valor do frete com base na tabela de frete e nos parâmetros.
 *
 * @param {Object} tabela  — registro da tabela tabelas_frete
 * @param {Object} params  — { pesoTotalKg, distanciaKm }
 * @returns {{ valorEstimado: number, tipoCalculo: string }}
 */
const calcularFrete = (tabela, { pesoTotalKg = 0, distanciaKm = 0 } = {}) => {
  let valorEstimado;

  switch (tabela.tipo_calculo) {
    case "POR_REGIAO":
      valorEstimado = calcularPorRegiao(tabela);
      break;

    case "POR_PESO":
      valorEstimado = calcularPorPeso(tabela, pesoTotalKg);
      break;

    case "POR_DISTANCIA":
      valorEstimado = calcularPorDistancia(tabela, distanciaKm);
      break;

    case "HIBRIDO":
      valorEstimado = calcularHibrido(tabela, pesoTotalKg, distanciaKm);
      break;

    default:
      throw new AppError(`Tipo de calculo '${tabela.tipo_calculo}' nao suportado pelo motor`, 400);
  }

  return {
    valorEstimado: Math.round(valorEstimado * 100) / 100,
    tipoCalculo: tabela.tipo_calculo
  };
};

module.exports = { calcularFrete };
