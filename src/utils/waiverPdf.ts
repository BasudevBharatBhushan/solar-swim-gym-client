import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { SignedWaiver } from '../services/waiverService';

const PAGE_MARGIN_MM = 12;
const MIN_PDF_BYTES = 4000;
const MAX_PDF_BYTES = 4 * 1024 * 1024;
const MAX_PDF_PAGES = 15;

const waitForNextPaint = async (): Promise<void> => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const waitForFonts = async (): Promise<void> => {
  const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fontSet?.ready) {
    return;
  }
  try {
    await fontSet.ready;
  } catch {
    // Continue with fallback fonts if explicit font loading fails.
  }
};

const waitForImages = async (root: HTMLElement, timeoutMs = 8000): Promise<void> => {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const finish = () => {
          cleanup();
          resolve();
        };

        const cleanup = () => {
          img.removeEventListener('load', finish);
          img.removeEventListener('error', finish);
          clearTimeout(timeoutId);
        };

        const timeoutId = window.setTimeout(finish, timeoutMs);
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
      });
    })
  );
};

const sanitizeForFileName = (value: string): string => {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'Profile';
};

const tryFetchAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Converts Quill's non-standard list HTML (using data-list attributes on <li> elements
 * inside <ol>) into standard <ul>/<ol> HTML that html2canvas and browsers can render properly.
 *
 * Quill produces:
 *   <ol><li data-list="bullet">item</li><li data-list="ordered">item</li></ol>
 *
 * We convert to:
 *   <ul><li>item</li></ul>  /  <ol><li>item</li></ol>
 */
const normalizeQuillLists = (html: string): string => {
  // Parse the HTML into a DOM tree so we can manipulate it
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__root');
  if (!root) return html;

  // Process all <li> elements with data-list attributes
  const listItems = Array.from(root.querySelectorAll('li[data-list]'));
  
  if (listItems.length === 0) return html;

  // Group consecutive items with the same type into proper list elements
  // We'll rebuild the structure by walking the children of each parent <ol>
  const processedParents = new Set<Element>();
  
  for (const li of listItems) {
    const parent = li.parentElement;
    if (!parent || processedParents.has(parent)) continue;
    processedParents.add(parent);

    // Gather all children and group them
    const children = Array.from(parent.childNodes);
    const fragment = doc.createDocumentFragment();
    
    let currentListEl: HTMLElement | null = null;
    let currentListType: string | null = null;

    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (el.tagName === 'LI') {
          const dataList = el.getAttribute('data-list') || 'bullet';
          const isBullet = dataList === 'bullet' || dataList === 'unchecked' || dataList === 'checked';
          const listType = isBullet ? 'UL' : 'OL';
          const indentLevel = parseInt(el.getAttribute('class')?.match(/ql-indent-(\d+)/)?.[1] || '0');

          if (currentListType !== listType) {
            // Start a new list
            currentListEl = doc.createElement(listType.toLowerCase());
            currentListEl.style.paddingLeft = `${1.5 + indentLevel * 1.5}em`;
            currentListEl.style.marginBottom = '0.75em';
            fragment.appendChild(currentListEl);
            currentListType = listType;
          }

          // Create a clean <li>
          const newLi = doc.createElement('li');
          newLi.style.marginBottom = '0.35em';
          newLi.innerHTML = el.innerHTML;
          // Remove data-list attribute from inner content if any
          newLi.removeAttribute('data-list');
          if (indentLevel > 0) {
            newLi.style.paddingLeft = `${indentLevel * 1.5}em`;
          }
          currentListEl!.appendChild(newLi);
        } else {
          // Non-LI element breaks the current list
          currentListType = null;
          currentListEl = null;
          fragment.appendChild(child.cloneNode(true));
        }
      } else {
        // Text nodes
        currentListType = null;
        currentListEl = null;
        fragment.appendChild(child.cloneNode(true));
      }
    }

    // Replace parent's content with our processed fragment
    parent.innerHTML = '';
    parent.appendChild(fragment);
  }

  return root.innerHTML;
};

/**
 * Inlines all Quill formatting classes as real CSS styles so html2canvas can render them.
 * This handles ql-align-*, ql-size-*, inline color spans, etc.
 */
const inlineQuillStyles = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="__root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__root');
  if (!root) return html;

  // Handle text alignment classes
  const alignments: Array<[string, string]> = [
    ['ql-align-center', 'center'],
    ['ql-align-right', 'right'],
    ['ql-align-justify', 'justify'],
  ];
  for (const [cls, value] of alignments) {
    root.querySelectorAll(`.${cls}`).forEach((el) => {
      (el as HTMLElement).style.textAlign = value;
    });
  }

  // Handle header sizes (h1-h6)
  const headerStyles: Record<string, string> = {
    H1: '2em',
    H2: '1.5em',
    H3: '1.17em',
    H4: '1em',
    H5: '0.83em',
    H6: '0.67em',
  };
  for (const [tag, size] of Object.entries(headerStyles)) {
    root.querySelectorAll(tag).forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl.style.fontSize) {
        htmlEl.style.fontSize = size;
        htmlEl.style.fontWeight = 'bold';
        htmlEl.style.marginBottom = '0.5em';
        htmlEl.style.marginTop = '0.5em';
      }
    });
  }

  // Handle ql-size classes
  const sizeMap: Record<string, string> = {
    'ql-size-small': '10px',
    'ql-size-large': '18px',
    'ql-size-huge': '24px',
  };
  for (const [cls, size] of Object.entries(sizeMap)) {
    root.querySelectorAll(`.${cls}`).forEach((el) => {
      (el as HTMLElement).style.fontSize = size;
    });
  }

  // Handle indent classes on block elements (paragraphs not in lists)
  for (let i = 1; i <= 8; i++) {
    root.querySelectorAll(`.ql-indent-${i}`).forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.tagName !== 'LI') {
        htmlEl.style.paddingLeft = `${i * 3}em`;
      }
    });
  }

  // Handle blockquotes
  root.querySelectorAll('blockquote').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.borderLeft = '4px solid #ccc';
    htmlEl.style.paddingLeft = '1em';
    htmlEl.style.marginLeft = '0';
    htmlEl.style.color = '#555';
  });

  // Handle code blocks
  root.querySelectorAll('pre').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.backgroundColor = '#f4f4f4';
    htmlEl.style.padding = '0.5em';
    htmlEl.style.borderRadius = '4px';
    htmlEl.style.fontFamily = 'monospace';
    htmlEl.style.fontSize = '12px';
    htmlEl.style.whiteSpace = 'pre-wrap';
  });

  return root.innerHTML;
};

/**
 * Full CSS injected into <head> for the render container.
 * Covers Quill editor defaults + our custom scope.
 */
const WAIVER_PDF_STYLES = `
  .waiver-pdf-root {
    font-family: Arial, Helvetica, sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.55;
    font-size: 14px;
    word-wrap: break-word;
  }
  .waiver-pdf-root p {
    margin: 0 0 0.75em 0;
    hyphens: auto;
  }
  .waiver-pdf-root h1, .waiver-pdf-root h2, .waiver-pdf-root h3,
  .waiver-pdf-root h4, .waiver-pdf-root h5, .waiver-pdf-root h6 {
    margin: 0.75em 0 0.5em 0;
    font-weight: bold;
    line-height: 1.2;
  }
  .waiver-pdf-root h1 { font-size: 2em; }
  .waiver-pdf-root h2 { font-size: 1.5em; }
  .waiver-pdf-root h3 { font-size: 1.17em; }
  .waiver-pdf-root h4 { font-size: 1em; }
  .waiver-pdf-root h5 { font-size: 0.83em; }
  .waiver-pdf-root h6 { font-size: 0.67em; }
  .waiver-pdf-root ul, .waiver-pdf-root ol {
    padding-left: 2em;
    margin: 0 0 0.75em 0;
    list-style-position: outside;
  }
  .waiver-pdf-root ul { list-style-type: disc; }
  .waiver-pdf-root ol { list-style-type: decimal; }
  .waiver-pdf-root li { margin-bottom: 0.35em; }
  .waiver-pdf-root img { max-width: 100%; height: auto; display: block; }
  .waiver-pdf-root blockquote {
    border-left: 4px solid #ccc;
    padding-left: 1em;
    margin-left: 0;
    color: #555;
  }
  .waiver-pdf-root pre {
    background: #f4f4f4;
    padding: 0.5em;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
  }
  .waiver-pdf-root strong, .waiver-pdf-root b { font-weight: bold; }
  .waiver-pdf-root em, .waiver-pdf-root i { font-style: italic; }
  .waiver-pdf-root u { text-decoration: underline; }
  .waiver-pdf-root s { text-decoration: line-through; }
  .waiver-pdf-root a { color: #2563eb; text-decoration: underline; }
  /* Quill alignment overrides */
  .waiver-pdf-root .ql-align-center { text-align: center !important; }
  .waiver-pdf-root .ql-align-right  { text-align: right  !important; }
  .waiver-pdf-root .ql-align-justify { 
    text-align: justify !important; 
    text-justify: inter-word !important;
  }
  /* Quill indent overrides */
  .waiver-pdf-root .ql-indent-1 { padding-left: 3em !important; }
  .waiver-pdf-root .ql-indent-2 { padding-left: 6em !important; }
  .waiver-pdf-root .ql-indent-3 { padding-left: 9em !important; }
  .waiver-pdf-root .ql-indent-4 { padding-left: 12em !important; }
  .waiver-pdf-root li.ql-indent-1 { padding-left: 4.5em !important; }
  .waiver-pdf-root li.ql-indent-2 { padding-left: 7.5em !important; }
  .waiver-pdf-root li.ql-indent-3 { padding-left: 10.5em !important; }
  /* Quill size */
  .waiver-pdf-root .ql-size-small { font-size: 10px; }
  .waiver-pdf-root .ql-size-large { font-size: 18px; }
  .waiver-pdf-root .ql-size-huge  { font-size: 24px; }
`;

const WAIVER_STYLE_ID = 'waiver-pdf-root-styles';

const injectPdfStyles = (): void => {
  if (document.getElementById(WAIVER_STYLE_ID)) return;
  const styleEl = document.createElement('style');
  styleEl.id = WAIVER_STYLE_ID;
  styleEl.textContent = WAIVER_PDF_STYLES;
  document.head.appendChild(styleEl);
};

const removePdfStyles = (): void => {
  const styleEl = document.getElementById(WAIVER_STYLE_ID);
  if (styleEl) styleEl.remove();
};

/**
 * Builds the final HTML string for the waiver PDF render.
 * All Quill-specific formatting is normalized before generating the HTML.
 */
const buildWaiverHtml = (waiver: SignedWaiver, signatureDataUrl: string | null): string => {
  const signedAt = waiver.signed_at ? new Date(waiver.signed_at).toLocaleString() : 'Not available';

  // Step 1: Convert Quill's non-standard list markup to standard HTML
  let processedContent = normalizeQuillLists(waiver.content || '');

  // Step 2: Inline Quill CSS classes as explicit style attributes
  processedContent = inlineQuillStyles(processedContent);

  const signatureSection = signatureDataUrl
    ? `
      <div style="margin-top: 32px; border-top: 2px solid #e2e8f0; padding-top: 16px;">
        <p style="margin: 0 0 8px; color: #475569; font-size: 13px; font-weight: 600;">
          Digitally Signed on: ${signedAt}
        </p>
        <img src="${signatureDataUrl}" alt="Signature" style="max-height: 90px; border: 1px solid #e2e8f0; padding: 4px; background: #fff; border-radius: 4px;" />
        <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
          This document was electronically signed.
        </p>
      </div>
    `
    : waiver.signature_url
      ? `
        <div style="margin-top: 32px; border-top: 2px solid #e2e8f0; padding-top: 16px;">
          <p style="margin: 0; color: #475569; font-size: 13px; font-weight: 600;">
            Digitally Signed on: ${signedAt}
          </p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
            This document was electronically signed.
          </p>
        </div>
      `
      : '';

  return `
    <div class="waiver-pdf-root">
      <div style="padding: 0;">${processedContent}</div>
      ${signatureSection}
    </div>
  `;
};

const createRenderContainer = (html: string): HTMLElement => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '0';
  // Letter width in px at 96dpi = 816px.
  container.style.width = '816px';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#ffffff';
  container.style.visibility = 'visible';
  container.style.overflow = 'visible';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-1';
  container.innerHTML = html;
  return container;
};

const canvasHasVisibleContent = (canvas: HTMLCanvasElement): boolean => {
  const probeCanvas = document.createElement('canvas');
  probeCanvas.width = 96;
  probeCanvas.height = 96;

  const probeContext = probeCanvas.getContext('2d', { willReadFrequently: true });
  if (!probeContext) return false;

  probeContext.fillStyle = '#ffffff';
  probeContext.fillRect(0, 0, probeCanvas.width, probeCanvas.height);
  probeContext.drawImage(canvas, 0, 0, probeCanvas.width, probeCanvas.height);

  const data = probeContext.getImageData(0, 0, probeCanvas.width, probeCanvas.height).data;
  let visiblePixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a > 0 && (r < 246 || g < 246 || b < 246)) {
      visiblePixelCount += 1;
      if (visiblePixelCount > 40) {
        return true;
      }
    }
  }

  return false;
};

const renderCanvas = async (container: HTMLElement): Promise<HTMLCanvasElement> => {
  const rect = container.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 10) {
    throw new Error(`Waiver render container has invalid size (${Math.round(rect.width)}x${Math.round(rect.height)}).`);
  }

  const canvas = await html2canvas(container, {
    scale: 1.5,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    // Ensure we capture the full scrollable height
    height: container.scrollHeight,
    windowHeight: container.scrollHeight + 200,
  });

  if (!canvas.width || !canvas.height) {
    throw new Error('Failed to capture waiver content for PDF.');
  }
  if (!canvasHasVisibleContent(canvas)) {
    throw new Error('Waiver capture resulted in a blank canvas.');
  }

  return canvas;
};

const canvasToPdfBlob = (canvas: HTMLCanvasElement): Blob => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const printableWidth = pageWidth - PAGE_MARGIN_MM * 2;
  const printableHeight = pageHeight - PAGE_MARGIN_MM * 2;

  // How many canvas pixels fit in one PDF page height
  const pageSliceHeightPx = Math.max(
    1,
    Math.floor((printableHeight * canvas.width) / printableWidth)
  );

  let currentOffsetPx = 0;
  let pageIndex = 0;

  while (currentOffsetPx < canvas.height) {
    const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - currentOffsetPx);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const context = pageCanvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to draw waiver content for PDF export.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      currentOffsetPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      pageCanvas.width,
      sliceHeightPx
    );

    // Use PNG for better text quality (higher size is acceptable for text-heavy docs)
    const imageData = pageCanvas.toDataURL('image/png');
    const renderedHeightMm = (sliceHeightPx * printableWidth) / canvas.width;

    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(imageData, 'PNG', PAGE_MARGIN_MM, PAGE_MARGIN_MM, printableWidth, renderedHeightMm, undefined, 'FAST');

    currentOffsetPx += sliceHeightPx;
    pageIndex += 1;
    if (pageIndex > MAX_PDF_PAGES) {
      throw new Error(`Waiver PDF exceeds maximum allowed pages (${MAX_PDF_PAGES}).`);
    }
  }

  if (pageIndex === 0) {
    throw new Error('No waiver content was rendered into the PDF.');
  }

  return pdf.output('blob');
};

export const createWaiverPdfAttachment = async (
  profile: { first_name: string; last_name: string },
  waiver: SignedWaiver
): Promise<File> => {
  const profileName = `${profile.first_name} ${profile.last_name}`.trim();
  const safeName = sanitizeForFileName(profileName);
  const fileName = `Waiver_${safeName}.pdf`;
  const signatureDataUrl = waiver.signature_url ? await tryFetchAsDataUrl(waiver.signature_url) : null;
  const html = buildWaiverHtml(waiver, signatureDataUrl);
  const container = createRenderContainer(html);

  // Inject full CSS into <head> so html2canvas picks it up via document.styleSheets
  injectPdfStyles();
  document.body.appendChild(container);

  try {
    await waitForFonts();
    // Give the browser 3 extra frames to fully apply styles + layout
    await waitForNextPaint();
    await waitForNextPaint();
    await waitForNextPaint();
    await waitForImages(container);

    const canvas = await renderCanvas(container);
    const pdfBlob = canvasToPdfBlob(canvas);

    if (pdfBlob.size < MIN_PDF_BYTES) {
      throw new Error('Failed to render waiver PDF content.');
    }
    if (pdfBlob.size > MAX_PDF_BYTES) {
      throw new Error(`Waiver PDF is too large (${Math.round(pdfBlob.size / 1024)} KB).`);
    }

    return new File([pdfBlob], fileName, { type: 'application/pdf' });
  } finally {
    document.body.removeChild(container);
    removePdfStyles();
  }
};
