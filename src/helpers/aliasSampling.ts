type RNGFunction = () => number;

type AliasData = {
    prob: number[];
    alias: number[];
};

const precomputeAlias = (p: number[], n: number): AliasData => {
    const sum = p.reduce((acc, val, index) => {
        if (val < 0) {
            throw new Error(`Probability must be positive: p[${index}]=${val}`);
        }
        return acc + val;
    }, 0);

    if (sum === 0) {
        throw new Error("Probability sum must be greater than zero.");
    }

    const scaledProbabilities = p.map(prob => (prob * n) / sum);
    const aliasData: AliasData = { prob: new Array(n), alias: new Array(n) };
    const small: number[] = [];
    const large: number[] = [];

    for (let i = n - 1; i >= 0; i--) {
        if (scaledProbabilities[i] < 1) {
            small.push(i);
        } else {
            large.push(i);
        }
    }

    while (small.length > 0 && large.length > 0) {
        const less = small.pop()!;
        const more = large.pop()!;
        aliasData.prob[less] = scaledProbabilities[less];
        aliasData.alias[less] = more;
        scaledProbabilities[more] = scaledProbabilities[more] + scaledProbabilities[less] - 1;
        if (scaledProbabilities[more] < 1) {
            small.push(more);
        } else {
            large.push(more);
        }
    }

    while (large.length > 0) {
        aliasData.prob[large.pop()!] = 1;
    }

    while (small.length > 0) {
        aliasData.prob[small.pop()!] = 1;
    }

    return aliasData;
};

const draw = (aliasData: AliasData, outcomes: any[], rng: RNGFunction): any => {
    const c = Math.floor(rng() * aliasData.prob.length);
    return rng() < aliasData.prob[c] ? outcomes[c] : outcomes[aliasData.alias[c]];
};

const next = (aliasData: AliasData, outcomes: any[], rng: RNGFunction, numOfSamples: number = 1): any | any[] => {
    if (numOfSamples === 1) {
        return draw(aliasData, outcomes, rng);
    }
    return Array.from({ length: numOfSamples }, () => draw(aliasData, outcomes, rng));
};

const sample = (probabilities: number[], outcomes?: any[], rng: RNGFunction = Math.random) => {
    if (!Array.isArray(probabilities)) {
        throw new Error("Probabilities must be an array.");
    }
    if (probabilities.length === 0) {
        throw new Error("Probabilities array must not be empty.");
    }

    const n = probabilities.length;
    const indexedOutcomes = outcomes ?? Array.from({ length: n }, (_, i) => i);
    const aliasData = precomputeAlias(probabilities, n);

    return {
        next: (numOfSamples?: number) => next(aliasData, indexedOutcomes, rng, numOfSamples),
    };
};

export default sample;
export { sample };
