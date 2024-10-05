
const updateDisplayTimeout = 2000;

const CopyToClipboard = (text: string, updateDisplay: () => void, resetDisplay: () => void) => {
    navigator.clipboard.writeText(text).then(() => {
        updateDisplay();
        setTimeout(() => {
            resetDisplay();
        }, updateDisplayTimeout);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

const CopyCurrentUrlToClipboard = (updateDisplay: () => void, resetDisplay: () => void) => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
    .then(() =>
    {
        updateDisplay();
        setTimeout(() => {
            resetDisplay();
        }, updateDisplayTimeout);
    })
    .catch(err => {
        console.error('Failed to copy: ', err);
    });
};


export  {CopyToClipboard, CopyCurrentUrlToClipboard};