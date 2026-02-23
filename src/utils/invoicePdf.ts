import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getAgeGroupName } from '../lib/ageUtils';

const waitForNextPaint = async (): Promise<void> => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const waitForFonts = async (): Promise<void> => {
  const fontSet = (document as any).fonts;
  if (!fontSet?.ready) return;
  try {
    await fontSet.ready;
  } catch {}
};

const buildInvoiceHtml = (
  invoice: any, 
  subscriptions: any[], 
  location: any, 
  ageGroups: any[],
  servicePacks: Record<string, any>,
  membershipDetails: Record<string, any>,
  basePrices: Record<string, any>
): string => {
  const invoiceDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  }) : 'N/A';

  const rowsHtml = subscriptions.map((sub) => {
    const pack = servicePacks[sub.subscription_id];
    const bp = basePrices[sub.subscription_id];
    const mem = membershipDetails[sub.subscription_id];
    const coverage = (sub.subscription_coverage || sub.coverage || [])
      .map((c: any) => `${c.profile?.first_name || 'Member'} (${getAgeGroupName(c.profile?.date_of_birth, ageGroups)})`)
      .join(', ');
    
    const period = sub.billing_period_start 
      ? `${new Date(sub.billing_period_start).toLocaleDateString()} - ${new Date(sub.billing_period_end).toLocaleDateString()}`
      : 'N/A';

    let itemName = sub.subscription_type;
    if (pack?.service?.name) itemName = `${pack.service.name}: ${pack.name}`;
    else if (bp) itemName = bp.name;
    else if (mem) itemName = mem.name;
    else if (sub.pricing_plan?.name) itemName = sub.pricing_plan.name;

    const unitPrice = Number(sub.actual_total_amount || sub.unit_price_snapshot || sub.total_amount || 0).toFixed(2);
    const discount = Number(sub.discount_amount || 0).toFixed(2);
    const total = Number(sub.total_amount || 0).toFixed(2);

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; vertical-align: top;">
          <div style="font-weight: 700; color: #0f172a;">${itemName}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Coverage: ${coverage || 'N/A'}</div>
          <div style="font-size: 11px; color: #64748b;">Period: ${period}</div>
        </td>
        <td style="padding: 12px 8px; text-align: right; vertical-align: top;">$${unitPrice}</td>
        <td style="padding: 12px 8px; text-align: right; vertical-align: top; color: ${Number(discount) > 0 ? '#10b981' : '#0f172a'};">
          ${Number(discount) > 0 ? `-$${discount}` : '-'}
        </td>
        <td style="padding: 12px 8px; text-align: right; vertical-align: top; font-weight: 700;">$${total}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; padding: 40px; background: white; width: 714px;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
      </style>
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
            ${location?.name || 'Solar Swim'}
          </h1>
          <div style="margin-top: 8px; color: #64748b; font-size: 14px; line-height: 1.5;">
            ${location?.address || ''}<br/>
            Contact: support@solarswim.com
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; color: #1e293b;">Invoice</h2>
          <div style="margin-top: 8px; color: #64748b; font-size: 14px;">
            Invoice #: <span style="font-family: monospace; color: #0f172a;">${invoice.invoice_id?.substring(0, 12)}</span><br/>
            Date: ${invoiceDate}
          </div>
        </div>
      </div>

      <!-- Bill To area -->
      <div style="margin-bottom: 40px; border-top: 2px solid #f1f5f9; padding-top: 24px;">
        <div style="font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Bill To</div>
        <div style="font-size: 16px; font-weight: 700;">Account: ${invoice.account_id}</div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Item Description</th>
            <th style="padding: 12px 8px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Unit Price</th>
            <th style="padding: 12px 8px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Discount</th>
            <th style="padding: 12px 8px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #64748b; font-weight: 600;">Subtotal</span>
            <span style="font-weight: 700;">$${Number(invoice.total_amount || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 16px 0; margin-top: 8px; background: #f8fafc; padding: 12px;">
            <span style="font-size: 18px; font-weight: 800; color: #1e293b;">Amount Due</span>
            <span style="font-size: 18px; font-weight: 800; color: #2563eb;">$${Number(invoice.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 24px; border-top: 2px solid #f1f5f9; text-align: center;">
        <div style="color: #64748b; font-size: 14px; font-weight: 600;">Thank you for your business!</div>
        <div style="margin-top: 8px; color: #94a3b8; font-size: 12px;">
          If you have any questions about this invoice, please contact our support team.
        </div>
      </div>
    </div>
  `;
};

export const createInvoicePdfAttachment = async (
  invoice: any, 
  subscriptions: any[], 
  location: any, 
  ageGroups: any[],
  servicePacks: Record<string, any>,
  membershipDetails: Record<string, any>,
  basePrices: Record<string, any>
): Promise<File> => {
  const invoiceId = invoice.invoice_id || 'unnamed';
  const fileName = `Invoice_${invoiceId.substring(0, 8)}.pdf`;
  
  const html = buildInvoiceHtml(invoice, subscriptions, location, ageGroups, servicePacks, membershipDetails, basePrices);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.background = 'white';
  container.innerHTML = html;
  
  document.body.appendChild(container);

  try {
    await waitForFonts();
    await waitForNextPaint();
    await waitForNextPaint();

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    const pdfBlob = pdf.output('blob');
    return new File([pdfBlob], fileName, { type: 'application/pdf' });
  } finally {
    document.body.removeChild(container);
  }
};
