import * as pdfjsLib from 'pdfjs-dist';

// Use Vite's URL import to get the path to the worker in node_modules
// This ensures Vite bundles the worker correctly and serves it from the same origin
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).href;



/**
 * Extracts text from a PDF file.
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Sort items by Y (descending) and then X (ascending)
            // transform[5] is Y coordinate, transform[4] is X coordinate
            const items = textContent.items as any[];
            items.sort((a, b) => {
                if (Math.abs(a.transform[5] - b.transform[5]) < 5) { // Same line (with slight tolerance)
                    return a.transform[4] - b.transform[4];
                }
                return b.transform[5] - a.transform[5];
            });

            let pageText = "";
            let lastY = -1;
            let lastX = -1;

            for (const item of items) {
                if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += "\n";
                    lastX = -1; // Reset X for new line
                } else if (lastX !== -1) {
                    // Check horizontal gap to decide if we need extra space
                    const gap = item.transform[4] - lastX;
                    if (gap > 20) pageText += "    "; // Significant gap -> tab-like space
                    else if (gap > 2) pageText += " ";  // Small gap -> regular space
                }

                pageText += item.str;
                lastY = item.transform[5];
                lastX = item.transform[4] + (item.width || 0);
            }

            fullText += pageText + "\n\n";
        }

        if (!fullText.trim()) {
            throw new Error("The PDF seems to be empty or contains only images (scanned PDF). Text extraction is only possible for digital PDFs.");
        }

        return fullText.trim();
    } catch (error: any) {
        console.error("PDF extraction error detail:", error);
        if (error.name === 'PasswordException') {
            throw new Error("This PDF is password protected. Please upload an unprotected file.");
        }
        throw new Error(`Failed to parse PDF: ${error.message || "Unknown error"}. Please ensure it's a valid digital PDF.`);
    }
};
