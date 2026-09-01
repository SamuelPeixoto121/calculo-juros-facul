export function calculaParcela(montante, periodos) {
    const parcela = montante / periodos;
    const arr = [];
    const dtInicio = new Date();

    for (let i = 0; i < periodos; i++) {
        const vencimento = new Date(dtInicio.getFullYear(), dtInicio.getMonth() + i, dtInicio.getDate());
        arr.push({
            valor: +parcela.toFixed(2),
            vencimento: vencimento.toISOString().split('T')[0],
        })
    }

    return arr;
}