function RemoveAnsiAndBold(text: string) {
    // Regular expression to match ANSI escape codes
    const ansiRegex = /\x1b\[[0-9;]*m/g;

    // Replace ANSI escape codes with bold tags
    return text.replace(ansiRegex, (match) => {
        // Check if the match is a reset code (0m) or a bold code (1m)
        if (match === '\x1b[0m') {
            return '</u>';
        } else if (match === '\x1b[4m') {
            return '<u>';
        }
        // Remove other ANSI codes
        return '';
    });
}

export { RemoveAnsiAndBold };