import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateInvoicePdf(invoice: any) {
    const doc = new jsPDF()

    // Colors
    const primaryColor = '#1e293b' // slate-800
    const secondaryColor = '#64748b' // slate-500
    const accentColor = '#0df2a2' // VoiceRealty Green

    // Header
    doc.setFontSize(24)
    doc.setTextColor(primaryColor)
    doc.text('FACTUUR', 14, 22)

    // Logo / Company Name
    // doc.setTextColor(accentColor)
    doc.setFontSize(16)
    doc.text('VoiceRealty', 150, 20)

    // Company format
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor)
    doc.text('Bedrijfsstraat 1', 150, 26)
    doc.text('1000 AB Amsterdam', 150, 31)
    doc.text('KVK: 12345678', 150, 36)
    doc.text('BTW: NL123456789B01', 150, 41)

    // Invoice Info
    doc.setFontSize(12)
    doc.setTextColor(primaryColor)
    doc.text('Factuurgegevens:', 14, 40)

    doc.setFontSize(10)
    doc.setTextColor(secondaryColor)
    doc.text(`Factuurnummer: ${invoice.id}`, 14, 46)
    doc.text(`Factuurdatum: ${invoice.date}`, 14, 51)
    doc.text(`Vervaldatum: ${invoice.date}`, 14, 56)

    // Status
    const statusColor = invoice.status === 'Betaald' ? [13, 242, 162] : [245, 158, 11]
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 61)

    // Reset color for table
    doc.setTextColor(primaryColor)

    // Items table
    autoTable(doc, {
        startY: 75,
        head: [['Omschrijving', 'Aantal', 'Prijs', 'Totaal']],
        body: [
            ['VoiceRealty Abonnement - ' + (invoice.document || 'Plan'), '1', invoice.amount.replace('€ ', ''), invoice.amount.replace('€ ', '')]
        ],
        theme: 'striped',
        headStyles: {
            fillColor: [30, 41, 59], // primaryColor
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 5,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // slate-50
        }
    })

    // Totals
    const finalY = ((doc as any).lastAutoTable?.finalY || 100) + 10

    doc.setFontSize(10)
    doc.setTextColor(secondaryColor)
    doc.text('Subtotaal:', 130, finalY)
    doc.text('Btw (21%):', 130, finalY + 7)

    doc.setFontSize(12)
    doc.setTextColor(primaryColor)
    doc.text('Totaal inclusief BTW:', 130, finalY + 16)

    doc.setFontSize(10)
    doc.text(invoice.amount, 180, finalY, { align: 'right' })
    // Approx calc for VAT, standard practice just shows what was paid
    // Here we just display the final amount as it's an abstract value
    doc.text('Inbegrepen', 180, finalY + 7, { align: 'right' })

    doc.setFontSize(12)
    doc.text(invoice.amount, 180, finalY + 16, { align: 'right' })

    // Footer
    doc.setFontSize(9)
    // Save PDF
    doc.save(`Factuur_${invoice.id}.pdf`)
}
