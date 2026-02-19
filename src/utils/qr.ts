import QRCode from 'qrcode'

export async function generateQrCode(url: string): Promise<string> {
    try {
        return await QRCode.toDataURL(url)
    } catch (err) {
        console.error(err)
        return ''
    }
}
