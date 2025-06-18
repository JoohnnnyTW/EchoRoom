
// utils/arrayUtils.ts
export const ensureThreeTerms = (terms?: string[]): string[] => {
    const currentTerms = Array.isArray(terms) ? terms.filter(t => typeof t === 'string') : [];
    const ensured = [...currentTerms.slice(0, 3)];
    while (ensured.length < 3) {
        ensured.push('');
    }
    return ensured;
};
