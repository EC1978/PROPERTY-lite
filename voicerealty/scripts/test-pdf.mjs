import * as pdf from 'pdf-parse';

const minimalPdf = `%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj 4 0 obj<</Length 21>>stream
BT
/F1 1 Tf
(Hello) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000224 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
293
%%EOF`;

async function main() {
    try {
        console.log('Testing pdf-parse (ESM)...');
        console.log('Type of pdf:', typeof pdf);
        // console.log('Value of pdf:', pdf);

        const { PDFParse } = pdf;
        console.log('PDFParse:', PDFParse);
        console.log('PDFParse prototype keys:', Object.getOwnPropertyNames(PDFParse.prototype));

        const buffer = Buffer.from(minimalPdf);
        // Try instantiation with Uint8Array
        try {
            const uint8Array = new Uint8Array(buffer);
            const instance = new PDFParse(uint8Array);
            console.log('Instance created');
            const text = await instance.getText();
            console.log('Text extracted:', text);
        } catch (e) {
            console.log('Method call failed:', e);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
