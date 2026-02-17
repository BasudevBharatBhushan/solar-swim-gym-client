import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { SignedWaiver } from '../services/waiverService';

const PAGE_MARGIN_MM = 10;
const MIN_PDF_BYTES = 4000;
const MAX_PDF_BYTES = 4 * 1024 * 1024;
const MAX_PDF_PAGES = 12;

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

const waitForImages = async (root: HTMLElement, timeoutMs = 6000): Promise<void> => {
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

const buildWaiverHtml = (waiver: SignedWaiver, signatureDataUrl: string | null): string => {
  const signedAt = waiver.signed_at ? new Date(waiver.signed_at).toLocaleString() : 'Not available';

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; background: #ffffff; line-height: 1.45; font-size: 14px;">
      <style>
        * { box-sizing: border-box; }
        img { max-width: 100%; height: auto; }
        p, span, div, li, h1, h2, h3, h4, h5, h6, td, th { color: #0f172a !important; }
      </style>
      <div>${waiver.content}</div>
      ${
        signatureDataUrl
          ? `
            <div style="margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
              <p style="margin: 0 0 10px; color: #475569;">
                Signed on: ${signedAt}
              </p>
              <img src="${signatureDataUrl}" alt="Signature" style="max-height: 90px;" />
            </div>
          `
          : waiver.signature_url
            ? `
              <div style="margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
                <p style="margin: 0; color: #475569;">
                  Signed on: ${signedAt}
                </p>
              </div>
            `
            : ''
      }
    </div>
  `;
};

const createRenderContainer = (html: string): HTMLElement => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.padding = '24px';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#ffffff';
  container.style.visibility = 'visible';
  container.style.overflow = 'hidden';
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
  if (rect.width < 100 || rect.height < 100) {
    throw new Error(`Waiver render container has invalid size (${Math.round(rect.width)}x${Math.round(rect.height)}).`);
  }

  const canvas = await html2canvas(container, {
    scale: 1.25,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff'
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
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const printableWidth = pageWidth - PAGE_MARGIN_MM * 2;
  const printableHeight = pageHeight - PAGE_MARGIN_MM * 2;

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

    const imageData = pageCanvas.toDataURL('image/jpeg', 0.72);
    const renderedHeightMm = (sliceHeightPx * printableWidth) / canvas.width;

    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(imageData, 'JPEG', PAGE_MARGIN_MM, PAGE_MARGIN_MM, printableWidth, renderedHeightMm, undefined, 'FAST');

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
  const container = createRenderContainer(buildWaiverHtml(waiver, signatureDataUrl));

  document.body.appendChild(container);

  try {
    await waitForFonts();
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
  }
};
