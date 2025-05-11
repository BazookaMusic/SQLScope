function Alternating<T>(idx: number, options: T[]) : T
{
    const optionIdx = idx % options.length;
    return options[optionIdx];
}

export {Alternating}