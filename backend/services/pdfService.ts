import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "https://cdn.skypack.dev/pdf-lib@^1.17.1?dts";
import fontkit from 'https://cdn.skypack.dev/@pdf-lib/fontkit?dts';
import { getBankConfig } from './bankService.ts';
import { getReviewsByBank, calculateAverageRatings } from './reviewService.ts';
import { getReportsByBank, problemTypeTranslations } from './problemReportService.ts';
import { getBenefitsByBank } from './benefitsService.ts';
import { renderStars } from '../utils/renderUtils.ts';
import { banks } from "../config.ts";
import type { Review } from "../types.ts";

// --- Constants and Global Setup ---
const MARGIN = 50;
const FONT_SIZE = 10;
const LINE_HEIGHT = 15;
const COLORS = {
    primary: rgb(0.1, 0.3, 0.7),
    secondary: rgb(0.2, 0.6, 0.8),
    text: rgb(0.1, 0.1, 0.1),
    lightText: rgb(0.4, 0.4, 0.4),
    header: rgb(0, 0.53, 0.71),
    danger: rgb(0.7, 0, 0),
    gray: rgb(0.8, 0.8, 0.8)
};

// --- PDF Generation Context Class ---
class PdfContext {
    page: PDFPage;
    y: number;
    font: PDFFont;
    fontBold: PDFFont;
    pdfDoc: PDFDocument;
    contentWidth: number;

    constructor(pdfDoc: PDFDocument, page: PDFPage, font: PDFFont, fontBold: PDFFont) {
        this.pdfDoc = pdfDoc;
        this.page = page;
        this.y = page.getHeight() - MARGIN;
        this.font = font;
        this.fontBold = fontBold;
        this.contentWidth = page.getWidth() - 2 * MARGIN;
    }

    async checkNewPage() {
        if (this.y < MARGIN) {
            this.page = this.pdfDoc.addPage();
            this.y = this.page.getHeight() - MARGIN;
        }
    }

    async drawText(text: string, options: any = {}) {
        await this.checkNewPage();
        const lines = this.getLines(text, options.maxWidth || this.contentWidth, options.font || this.font, options.size || FONT_SIZE);
        for (const line of lines) {
             if (this.y < MARGIN && lines.length === 1) {
                 this.page = this.pdfDoc.addPage();
                 this.y = this.page.getHeight() - MARGIN;
             } else {
                  await this.checkNewPage();
             }

            this.page.drawText(line, {
                x: options.x || MARGIN,
                y: this.y,
                font: options.font || this.font,
                size: options.size || FONT_SIZE,
                color: options.color || COLORS.text,
            });
            this.y -= (options.lineHeight || LINE_HEIGHT);
        }
    }
    
    getLines(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
        const lines = [];
        const words = text.replace(/\n/g, ' \n ').split(' ');
        let currentLine = '';

        for (const word of words) {
            if (word === '\n') {
                lines.push(currentLine);
                currentLine = '';
                continue;
            }
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    async addSectionTitle(title: string) {
        this.y -= LINE_HEIGHT;
        await this.drawText(title, { font: this.fontBold, size: 16, color: COLORS.primary });
        this.y -= 5;
        this.page.drawLine({
            start: { x: MARGIN, y: this.y },
            end: { x: this.page.getWidth() - MARGIN, y: this.y },
            thickness: 1,
            color: COLORS.gray,
        });
        this.y -= LINE_HEIGHT * 1.5;
    }
}

// --- Data Calculation and Formatting ---
function calculateAverageSubRatings(reviews: Review[]) {
    const totals = { facilidadDeUso: 0, accesibilidad: 0, estabilidad: 0, precio: 0, serviciosAlUsuario: 0, count: 0 };
    for (const review of reviews) {
        if (review.subRatings) {
            totals.facilidadDeUso += review.subRatings.facilidadDeUso;
            totals.accesibilidad += review.subRatings.accesibilidad;
            totals.estabilidad += review.subRatings.estabilidad;
            totals.precio += review.subRatings.precio;
            totals.serviciosAlUsuario += review.subRatings.serviciosAlUsuario;
            totals.count++;
        }
    }
    if (totals.count === 0) return null;
    return {
        facilidadDeUso: totals.facilidadDeUso / totals.count,
        accesibilidad: totals.accesibilidad / totals.count,
        estabilidad: totals.estabilidad / totals.count,
        precio: totals.precio / totals.count,
        serviciosAlUsuario: totals.serviciosAlUsuario / totals.count,
    };
}

function formatDisplayDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateString;
    }
}

// --- Main PDF Generation Function ---
export async function generateBankSummaryPdf(bankName: string): Promise<Uint8Array> {
    const bankConfig = getBankConfig(bankName);
    if (!bankConfig) throw new Error(`Configuration for bank "${bankName}" not found.`);

    // 1. Fetch data
    const reviews = getReviewsByBank(bankName);
    const reports = (await getReportsByBank(bankName)).slice(0, 10);
    const benefits = getBenefitsByBank(bankName);
    const bankRating = calculateAverageRatings(banks)[bankName] || { average: 0, count: 0 };
    const avgSubRatings = calculateAverageSubRatings(reviews);

    // 2. Create PDF and prepare fonts
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    pdfDoc.setAuthor("MonitorBancos");
    pdfDoc.setTitle(`Resumen de ${bankName}`);

    // Fetch and embed fonts
    let customFont: PDFFont;
    let customFontBold: PDFFont;
    let starFormat: 'pdf' | 'pdf_fallback' = 'pdf';

    try {
        // Fetch font files from a reliable raw source (GitHub)
        const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Regular.ttf';
        const fontBoldUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Bold.ttf';

        const [fontRes, fontBoldRes] = await Promise.all([ fetch(fontUrl), fetch(fontBoldUrl) ]);

        if (!fontRes.ok || !fontBoldRes.ok) {
            throw new Error(`Failed to fetch fonts: Regular: ${fontRes.status}, Bold: ${fontBoldRes.status}`);
        }

        const [fontBytes, fontBoldBytes] = await Promise.all([ fontRes.arrayBuffer(), fontBoldRes.arrayBuffer() ]);

        customFont = await pdfDoc.embedFont(fontBytes);
        customFontBold = await pdfDoc.embedFont(fontBoldBytes);

    } catch (e) {
        console.error(`
---------------------------------------------------------------------
CUSTOM FONT LOADING FAILED. Falling back to standard font.
The PDF will be generated, but some characters (like stars) may not appear correctly.
Error: ${e.message}
---------------------------------------------------------------------
        `);
        customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        customFontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        starFormat = 'pdf_fallback'; // Use this to avoid rendering broken characters
    }

    const page = pdfDoc.addPage();
    const ctx = new PdfContext(pdfDoc, page, customFont, customFontBold);

    // --- 3. Draw content ---

    // -- Header Section --
    const headerTopY = ctx.y;
    const text1Size = 28;
    const text2Size = 24;
    const textVGap = 35; // Vertical gap between text baselines
    
    // Calculate the total height of the text block to size the logo
    const textBlockHeight = (ctx.fontBold.heightAtSize(text1Size)) + (ctx.font.heightAtSize(text2Size));
    const targetLogoDim = textBlockHeight; // Make the logo box a square with this height

    // Draw the text first to establish position
    const textX = MARGIN + targetLogoDim + 20;
    ctx.page.drawText(`Resumen Completo`, { x: textX, y: headerTopY, font: ctx.fontBold, size: text1Size, color: COLORS.header });
    ctx.page.drawText(bankName, { x: textX, y: headerTopY - textVGap, font: ctx.font, size: text2Size, color: COLORS.lightText });

    // Find and draw the logo
    const baseIconPath = bankConfig.icon.substring(0, bankConfig.icon.lastIndexOf('.'));
    const pngLogoPath = `${Deno.cwd()}/frontend${baseIconPath}.png`;
    const jpgLogoPath = `${Deno.cwd()}/frontend${baseIconPath}.jpg`;
    
    let logoBytes: Uint8Array | null = null;
    let logoExt: 'png' | 'jpg' | null = null;

    try {
        logoBytes = await Deno.readFile(pngLogoPath);
        logoExt = 'png';
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            try {
                logoBytes = await Deno.readFile(jpgLogoPath);
                logoExt = 'jpg';
            } catch (e2) {
                 if (e2 instanceof Deno.errors.NotFound) {
                    console.warn(`No compatible logo found for ${bankName} at ${pngLogoPath} or ${jpgLogoPath}`);
                 } else {
                    console.warn(`Could not read logo for ${bankName}: ${e2.message}`);
                 }
            }
        } else {
            console.warn(`Could not read logo for ${bankName}: ${e.message}`);
        }
    }

    if (logoBytes && logoExt) {
        try {
            let logoImage;
            if (logoExt === 'png') {
                logoImage = await pdfDoc.embedPng(logoBytes);
            } else { // logoExt === 'jpg'
                logoImage = await pdfDoc.embedJpg(logoBytes);
            }
            
            // Calculate final logo dimensions to fit in the square without stretching
            const aspectRatio = logoImage.width / logoImage.height;
            let finalLogoWidth, finalLogoHeight;
            if (aspectRatio > 1) { // Landscape
                finalLogoWidth = targetLogoDim;
                finalLogoHeight = targetLogoDim / aspectRatio;
            } else { // Portrait or square
                finalLogoHeight = targetLogoDim;
                finalLogoWidth = targetLogoDim * aspectRatio;
            }
            
            // Center the logo vertically with the text block
            const logoY = (headerTopY - finalLogoHeight) - ((textVGap + 5 - finalLogoHeight) / 2);

            ctx.page.drawImage(logoImage, {
                x: MARGIN,
                y: logoY,
                width: finalLogoWidth,
                height: finalLogoHeight,
            });
        } catch (e) {
            console.error(`Failed to embed logo for ${bankName}: ${e.message}`);
        }
    }
    
    // Update ctx.y to be below the header block
    ctx.y = headerTopY - textBlockHeight - 30;
    
    // --- Body Sections ---

    // Overall Rating
    await ctx.addSectionTitle('Calificación General');
    const stars = renderStars(bankRating.average, starFormat);
    await ctx.drawText(`${bankRating.average.toFixed(1)} ${stars} (de ${bankRating.count} reseñas)`, { size: 12 });
    
    // Detailed Sub-ratings
    if (avgSubRatings) {
        ctx.y -= 10;
        await ctx.drawText("Calificaciones por Categoría:", { font: ctx.fontBold, size: 11 });
        const subRatingLabels = { facilidadDeUso: "Facilidad de Uso", accesibilidad: "Accesibilidad", estabilidad: "Estabilidad", precio: "Precio/Costo", serviciosAlUsuario: "Atención al Usuario" };
        for (const [key, label] of Object.entries(subRatingLabels)) {
            const rating = avgSubRatings[key as keyof typeof avgSubRatings];
            const subStars = renderStars(rating, starFormat);
            await ctx.drawText(`${label}: ${rating.toFixed(1)} ${subStars}`, { size: 10, x: MARGIN + 10});
        }
    }

    // Benefits
    await ctx.addSectionTitle('Beneficios');
    if (benefits.length > 0) {
        for (const benefit of benefits) {
            await ctx.drawText(`• ${benefit.name}:`, { font: ctx.fontBold, size: 10, maxWidth: ctx.contentWidth - 10, x: MARGIN + 5 });
            ctx.y += 5;
            await ctx.drawText(benefit.description, { size: 10, maxWidth: ctx.contentWidth - 20, x: MARGIN + 15 });
            ctx.y -= 5;
        }
    } else {
        await ctx.drawText('No se encontraron beneficios específicos para este banco en el mes actual.', { size: 10 });
    }

    // Recent Problem Reports
    await ctx.addSectionTitle(`Últimos ${Math.min(10, reports.length)} Reportes de Problemas`);
    if (reports.length > 0) {
        for (const report of reports) {
            const problemType = problemTypeTranslations[report.problemType] || report.problemType;
            await ctx.drawText(`${formatDisplayDate(report.date)} - Problema: ${problemType}`, { font: ctx.fontBold, size: 11, color: COLORS.danger });
            if (report.description && report.description.trim()) {
                await ctx.drawText(`"${report.description}"`, { size: 10, x: MARGIN + 10, color: COLORS.lightText });
            }
            ctx.y -= 10;
        }
    } else {
        await ctx.drawText('No se han reportado problemas recientemente.', { size: 10 });
    }

    return await pdfDoc.save();
}