/**
 * @file textSplitter.js (Shared RAG Pipeline)
 * @description Document extraction, normalization, section identification,
 * and semantic chunking for candidate resumes and supporting documents.
 */

/**
 * Known resume section headers mapped to standardized section tags.
 */
const SECTION_PATTERNS = [
    { tag: "summary", regex: /^(?:summary|professional\s+summary|profile|about(?:\s+me)?|objective|overview)[:\s]*$/i },
    { tag: "skills", regex: /^(?:technical\s+skills|core\s+competencies|skills(?:\s+and\s+tools)?|technologies|proficiencies)[:\s]*$/i },
    { tag: "experience", regex: /^(?:work\s+experience|professional\s+experience|experience|employment(?:\s+history)?|work\s+history)[:\s]*$/i },
    { tag: "projects", regex: /^(?:projects|technical\s+projects|personal\s+projects|key\s+projects|portfolio)[:\s]*$/i },
    { tag: "education", regex: /^(?:education|academic\s+background|academic\s+qualifications|degrees)[:\s]*$/i },
    { tag: "certifications", regex: /^(?:certifications|licenses|courses|awards|achievements)[:\s]*$/i }
];

/**
 * Cleans and normalizes raw text extracted from PDF or plain text inputs.
 * @param {string} text - Raw input text
 * @returns {string} Normalized text
 */
export function normalizeText(text = "") {
    if (typeof text !== "string") return "";
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Replace non-printable ASCII/control characters except standard whitespace
        .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, " ")
        // Collapse 3+ newlines to double newlines
        .replace(/\n{3,}/g, "\n\n")
        // Collapse multiple horizontal spaces to single space
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}

/**
 * Identifies resume sections by scanning lines for section headers.
 * Groups lines into tagged section blocks.
 * @param {string} text - Normalized text
 * @returns {Array<{section: string, text: string}>}
 */
export function identifySections(text) {
    const lines = text.split("\n");
    const sections = [];
    let currentTag = "general";
    let currentLines = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            currentLines.push(line);
            continue;
        }

        // Check if line looks like a header (short length, matches known section regex)
        let matchedTag = null;
        if (trimmed.length <= 40) {
            for (const { tag, regex } of SECTION_PATTERNS) {
                if (regex.test(trimmed)) {
                    matchedTag = tag;
                    break;
                }
            }
        }

        if (matchedTag) {
            if (currentLines.length > 0 && currentLines.join("\n").trim().length > 0) {
                sections.push({
                    section: currentTag,
                    text: currentLines.join("\n").trim()
                });
            }
            currentTag = matchedTag;
            currentLines = [line];
        } else {
            currentLines.push(line);
        }
    }

    if (currentLines.length > 0 && currentLines.join("\n").trim().length > 0) {
        sections.push({
            section: currentTag,
            text: currentLines.join("\n").trim()
        });
    }

    return sections.length > 0 ? sections : [{ section: "general", text: text.trim() }];
}

/**
 * Recursively splits a string of text into chunks adhering to target size and overlap.
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Max characters per chunk (default 650)
 * @param {number} chunkOverlap - Overlap characters between chunks (default 100)
 * @returns {string[]} Array of chunk strings
 */
export function splitTextIntoChunks(text, chunkSize = 650, chunkOverlap = 100) {
    if (!text || text.trim().length === 0) return [];
    if (text.length <= chunkSize) return [text.trim()];

    const separators = ["\n\n", "\n", ". ", "; ", ", ", " "];
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSize;
        if (end >= text.length) {
            const chunk = text.slice(start).trim();
            if (chunk) chunks.push(chunk);
            break;
        }

        // Search backwards for the best natural separator
        let splitPoint = -1;
        for (const sep of separators) {
            const searchIndex = text.lastIndexOf(sep, end);
            if (searchIndex > start + Math.floor(chunkSize * 0.3)) {
                splitPoint = searchIndex + sep.length;
                break;
            }
        }

        // If no separator found, hard cut
        if (splitPoint === -1) {
            splitPoint = end;
        }

        const chunk = text.slice(start, splitPoint).trim();
        if (chunk) chunks.push(chunk);

        // Move forward, subtracting overlap
        start = Math.max(start + 1, splitPoint - chunkOverlap);
    }

    return chunks;
}

/**
 * Processes a full document text, identifying sections and generating
 * semantic chunks with full provenance metadata.
 * 
 * @param {object} params
 * @param {string} params.text - Raw or normalized document text
 * @param {string} params.userId - Owner user ID
 * @param {string} [params.documentId] - Document identifier (e.g., resume._id)
 * @param {string} [params.documentType="resume"] - Document type
 * @param {number} [params.documentVersion=1] - Document version
 * @param {number} [params.chunkSize=650] - Target characters per chunk
 * @param {number} [params.chunkOverlap=100] - Overlap characters between chunks
 * @returns {Array<object>} Array of structured chunk objects with metadata
 */
export function processDocument({
    text,
    userId,
    documentId = null,
    documentType = "resume",
    documentVersion = 1,
    chunkSize = 650,
    chunkOverlap = 100
}) {
    if (!userId) {
        throw new Error("processDocument: userId is required for tenant isolation metadata");
    }

    const normalized = normalizeText(text);
    if (!normalized) return [];

    const sections = identifySections(normalized);
    const chunks = [];
    let globalIndex = 0;
    const createdAt = new Date().toISOString();

    for (const sectionBlock of sections) {
        const sectionChunks = splitTextIntoChunks(sectionBlock.text, chunkSize, chunkOverlap);

        for (const chunkText of sectionChunks) {
            if (chunkText.trim().length === 0) continue;

            chunks.push({
                text: chunkText,
                metadata: {
                    userId: String(userId),
                    documentId: documentId ? String(documentId) : null,
                    documentType,
                    documentVersion: Number(documentVersion) || 1,
                    chunkIndex: globalIndex,
                    sourceSection: sectionBlock.section,
                    charCount: chunkText.length,
                    createdAt
                }
            });
            globalIndex++;
        }
    }

    return chunks;
}
