export const useCalculateString = () => {
    const calculate = (formula: string) => {
        try {
            const regex = /[^0-9\+\-*/^%.]/;
            if (regex.test(formula)) return 'N/A'
            return Function('return (' + formula + ');')()
        } catch (e) {
            console.error(e);
            return 'invalid';
        }
    }

    return {
        calculate
    }
}